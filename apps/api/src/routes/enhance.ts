import { and, asc, desc, eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import { createdEnhance, enhanceSession } from "@workspace/db/schema/enhance"
import { enhanceSessionTitleFromSource } from "@workspace/shared/api/enhance/models"
import {
  createEnhanceSessionRequestSchema,
  createEnhanceTurnRequestSchema,
  enhanceSessionIdParamsSchema,
} from "@workspace/shared/api/enhance/schemas"
import type {
  CreatedEnhanceResponse,
  CreateEnhanceTurnRequest,
  EnhanceSessionListResponse,
  EnhanceSessionResponse,
  EnhanceUploadResponse,
} from "@workspace/shared/api/enhance/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalEnhance } from "@/lib/enhance/fal"
import { uploadCreatedEnhance, uploadEnhanceSource } from "@/lib/storage"
import { validator } from "@/lib/validator"

const maxImageUploadBytes = 20 * 1024 * 1024
const maxVideoUploadBytes = 200 * 1024 * 1024
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])
const allowedVideoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

export const enhanceRoutes = new Hono()

enhanceRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ enhance: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(enhanceSession)
        .where(eq(enhanceSession.organizationId, organizationId))
        .orderBy(desc(enhanceSession.updatedAt))

      return c.json(sessions satisfies EnhanceSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load enhance sessions" }, 500)
    }
  }
)

enhanceRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ enhance: ["create"] }),
  validator("json", createEnhanceSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(enhanceSession)
        .values({
          id: sessionId,
          organizationId,
          userId,
          title: enhanceSessionTitleFromSource({
            prompt: payload.prompt,
            mediaType: payload.mediaType,
            sourceUrl: payload.sourceUrl,
          }),
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      if (!session) {
        return c.json({ error: "Failed to create enhance session" }, 500)
      }

      const turn = await insertTurn(sessionId, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create enhance turn" }, 500)
      }

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Enhance turn failed", error)
      })

      return c.json(
        {
          ...session,
          turns: [turn],
        } satisfies EnhanceSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create enhance session" }, 500)
    }
  }
)

enhanceRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ enhance: ["read"] }),
  validator("param", enhanceSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Enhance session not found" }, 404)
      }

      return c.json(session satisfies EnhanceSessionResponse)
    } catch {
      return c.json({ error: "Failed to load enhance session" }, 500)
    }
  }
)

enhanceRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ enhance: ["delete"] }),
  validator("param", enhanceSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Enhance session not found" }, 404)
      }

      await db
        .delete(enhanceSession)
        .where(
          and(
            eq(enhanceSession.id, id),
            eq(enhanceSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies EnhanceSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete enhance session" }, 500)
    }
  }
)

enhanceRoutes.post(
  "/sessions/:id/turns",
  requireOrganization,
  requirePermission({ enhance: ["create"] }),
  validator("param", enhanceSessionIdParamsSchema),
  validator("json", createEnhanceTurnRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Enhance session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const now = new Date()
      const turn = await insertTurn(id, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create enhance turn" }, 500)
      }

      await db
        .update(enhanceSession)
        .set({ updatedAt: now })
        .where(eq(enhanceSession.id, id))

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Enhance turn failed", error)
      })

      return c.json(turn satisfies CreatedEnhanceResponse, 201)
    } catch {
      return c.json({ error: "Failed to create enhance turn" }, 500)
    }
  }
)

enhanceRoutes.post(
  "/uploads",
  requireOrganization,
  requirePermission({ enhance: ["create"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const body = await c.req.parseBody()
      const file = body.file

      if (!(file instanceof File)) {
        return c.json({ error: "File is required" }, 400)
      }

      const isImage = allowedImageTypes.has(file.type)
      const isVideo = allowedVideoTypes.has(file.type)

      if (!isImage && !isVideo) {
        return c.json(
          {
            error:
              "File must be JPEG, PNG, WebP, MP4, WebM, or QuickTime video",
          },
          400
        )
      }

      const maxBytes = isVideo ? maxVideoUploadBytes : maxImageUploadBytes

      if (file.size > maxBytes) {
        return c.json(
          {
            error: isVideo
              ? "Video must be 200MB or smaller"
              : "Image must be 20MB or smaller",
          },
          400
        )
      }

      const url = await uploadEnhanceSource({
        organizationId,
        assetId: crypto.randomUUID(),
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      })

      return c.json(
        {
          url,
          mediaType: isVideo ? "video" : "image",
        } satisfies EnhanceUploadResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to upload file" }, 500)
    }
  }
)

async function insertTurn(
  sessionId: string,
  payload: CreateEnhanceTurnRequest,
  createdAt: Date
) {
  const [turn] = await db
    .insert(createdEnhance)
    .values({
      id: crypto.randomUUID(),
      sessionId,
      mediaType: payload.mediaType,
      sourceUrl: payload.sourceUrl,
      model: payload.model,
      prompt: payload.prompt?.trim() ? payload.prompt.trim() : null,
      scale: payload.scale ?? null,
      creativity: payload.creativity ?? null,
      detail: payload.detail ?? null,
      shapePreservation: payload.shapePreservation ?? null,
      upscaleMode: payload.upscaleMode ?? null,
      targetResolution: payload.targetResolution ?? null,
      noiseScale: payload.noiseScale ?? null,
      topazModel: payload.topazModel ?? null,
      targetFps: payload.targetFps ?? null,
      status: "pending",
      createdAt,
    })
    .returning()

  return turn ?? null
}

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(enhanceSession)
    .where(
      and(
        eq(enhanceSession.id, id),
        eq(enhanceSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionTurns(sessionId: string) {
  return db
    .select()
    .from(createdEnhance)
    .where(eq(createdEnhance.sessionId, sessionId))
    .orderBy(asc(createdEnhance.createdAt))
}

async function loadOrganizationSession(organizationId: string, id: string) {
  const session = await findOrganizationSession(organizationId, id)

  if (!session) {
    return null
  }

  return {
    ...session,
    turns: await loadSessionTurns(session.id),
  }
}

async function runTurn(turnId: string, organizationId: string) {
  const [turn] = await db
    .select()
    .from(createdEnhance)
    .where(eq(createdEnhance.id, turnId))

  if (!turn) {
    return
  }

  try {
    const mediaType =
      turn.mediaType === "video" ? ("video" as const) : ("image" as const)
    const generated = await generateFalEnhance({
      modelId: turn.model,
      mediaType,
      sourceUrl: turn.sourceUrl,
      prompt: turn.prompt,
      scale: turn.scale,
      creativity: turn.creativity,
      detail: turn.detail,
      shapePreservation: turn.shapePreservation,
      upscaleMode: turn.upscaleMode,
      targetResolution: turn.targetResolution,
      noiseScale: turn.noiseScale,
      topazModel: turn.topazModel,
      targetFps: turn.targetFps,
    })
    const url = await uploadCreatedEnhance({
      organizationId,
      turnId: turn.id,
      body: generated.body,
      contentType: generated.contentType,
      mediaType: generated.mediaType,
    })

    await db
      .update(createdEnhance)
      .set({
        status: "completed",
        url,
        error: null,
        falRequestId: generated.requestId,
      })
      .where(eq(createdEnhance.id, turn.id))
  } catch (error) {
    await db
      .update(createdEnhance)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Enhance turn failed",
      })
      .where(eq(createdEnhance.id, turn.id))
  }

  await db
    .update(enhanceSession)
    .set({ updatedAt: new Date() })
    .where(eq(enhanceSession.id, turn.sessionId))
}
