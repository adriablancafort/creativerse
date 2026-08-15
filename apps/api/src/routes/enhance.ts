import { and, asc, desc, eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import { enhanceGeneration, enhanceSession } from "@workspace/db/schema/enhance"
import { enhanceSessionTitleFromSource } from "@workspace/shared/api/enhance/models"
import {
  createEnhanceGenerationRequestSchema,
  createEnhanceSessionRequestSchema,
  enhanceSessionIdParamsSchema,
} from "@workspace/shared/api/enhance/schemas"
import type {
  CreateEnhanceGenerationRequest,
  EnhanceGenerationResponse,
  EnhanceSessionListResponse,
  EnhanceSessionResponse,
  EnhanceUploadResponse,
} from "@workspace/shared/api/enhance/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalEnhance } from "@/lib/enhance/fal"
import { uploadEnhancedMedia, uploadEnhanceSource } from "@/lib/storage"
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

      const generation = await insertGeneration(sessionId, payload, now)

      if (!generation) {
        return c.json({ error: "Failed to create enhance generation" }, 500)
      }

      runGeneration(generation.id, organizationId).catch((error) => {
        console.error("Enhance generation failed", error)
      })

      return c.json(
        {
          ...session,
          generations: [generation],
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
  "/sessions/:id/generations",
  requireOrganization,
  requirePermission({ enhance: ["create"] }),
  validator("param", enhanceSessionIdParamsSchema),
  validator("json", createEnhanceGenerationRequestSchema),
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
      const generation = await insertGeneration(id, payload, now)

      if (!generation) {
        return c.json({ error: "Failed to create enhance generation" }, 500)
      }

      await db
        .update(enhanceSession)
        .set({ updatedAt: now })
        .where(eq(enhanceSession.id, id))

      runGeneration(generation.id, organizationId).catch((error) => {
        console.error("Enhance generation failed", error)
      })

      return c.json(generation satisfies EnhanceGenerationResponse, 201)
    } catch {
      return c.json({ error: "Failed to create enhance generation" }, 500)
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

async function insertGeneration(
  sessionId: string,
  payload: CreateEnhanceGenerationRequest,
  createdAt: Date
) {
  const [generation] = await db
    .insert(enhanceGeneration)
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

  return generation ?? null
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

async function loadSessionGenerations(sessionId: string) {
  return db
    .select()
    .from(enhanceGeneration)
    .where(eq(enhanceGeneration.sessionId, sessionId))
    .orderBy(asc(enhanceGeneration.createdAt))
}

async function loadOrganizationSession(organizationId: string, id: string) {
  const session = await findOrganizationSession(organizationId, id)

  if (!session) {
    return null
  }

  return {
    ...session,
    generations: await loadSessionGenerations(session.id),
  }
}

async function runGeneration(generationId: string, organizationId: string) {
  const [generation] = await db
    .select()
    .from(enhanceGeneration)
    .where(eq(enhanceGeneration.id, generationId))

  if (!generation) {
    return
  }

  try {
    const mediaType =
      generation.mediaType === "video" ? ("video" as const) : ("image" as const)
    const generated = await generateFalEnhance({
      modelId: generation.model,
      mediaType,
      sourceUrl: generation.sourceUrl,
      prompt: generation.prompt,
      scale: generation.scale,
      creativity: generation.creativity,
      detail: generation.detail,
      shapePreservation: generation.shapePreservation,
      upscaleMode: generation.upscaleMode,
      targetResolution: generation.targetResolution,
      noiseScale: generation.noiseScale,
      topazModel: generation.topazModel,
      targetFps: generation.targetFps,
    })
    const url = await uploadEnhancedMedia({
      organizationId,
      generationId: generation.id,
      body: generated.body,
      contentType: generated.contentType,
      mediaType: generated.mediaType,
    })

    await db
      .update(enhanceGeneration)
      .set({
        status: "completed",
        url,
        error: null,
        falRequestId: generated.requestId,
      })
      .where(eq(enhanceGeneration.id, generation.id))
  } catch (error) {
    await db
      .update(enhanceGeneration)
      .set({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Enhance generation failed",
      })
      .where(eq(enhanceGeneration.id, generation.id))
  }

  await db
    .update(enhanceSession)
    .set({ updatedAt: new Date() })
    .where(eq(enhanceSession.id, generation.sessionId))
}
