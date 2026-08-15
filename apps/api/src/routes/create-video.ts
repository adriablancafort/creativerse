import { and, asc, desc, eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import {
  createdVideo,
  createVideoSession,
} from "@workspace/db/schema/create-video"
import { videoSessionTitleFromPrompt } from "@workspace/shared/api/create-video/models"
import {
  createVideoSessionIdParamsSchema,
  createVideoSessionRequestSchema,
  createVideoTurnRequestSchema,
} from "@workspace/shared/api/create-video/schemas"
import type {
  CreatedVideoResponse,
  CreateVideoSessionListResponse,
  CreateVideoSessionResponse,
  CreateVideoTurnRequest,
  CreateVideoUploadResponse,
} from "@workspace/shared/api/create-video/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalVideo } from "@/lib/create-video/fal"
import { uploadCreatedVideo, uploadVideoFrame } from "@/lib/storage"
import { validator } from "@/lib/validator"

const maxUploadBytes = 20 * 1024 * 1024
const allowedFrameTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export const createVideoRoutes = new Hono()

createVideoRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ createVideo: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(createVideoSession)
        .where(eq(createVideoSession.organizationId, organizationId))
        .orderBy(desc(createVideoSession.updatedAt))

      return c.json(sessions satisfies CreateVideoSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load create video sessions" }, 500)
    }
  }
)

createVideoRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ createVideo: ["create"] }),
  validator("json", createVideoSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(createVideoSession)
        .values({
          id: sessionId,
          organizationId,
          userId,
          title: videoSessionTitleFromPrompt(payload.prompt),
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      if (!session) {
        return c.json({ error: "Failed to create video session" }, 500)
      }

      const turn = await insertTurn(sessionId, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create video turn" }, 500)
      }

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Create video turn failed", error)
      })

      return c.json(
        {
          ...session,
          turns: [turn],
        } satisfies CreateVideoSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create video session" }, 500)
    }
  }
)

createVideoRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ createVideo: ["read"] }),
  validator("param", createVideoSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create video session not found" }, 404)
      }

      return c.json(session satisfies CreateVideoSessionResponse)
    } catch {
      return c.json({ error: "Failed to load create video session" }, 500)
    }
  }
)

createVideoRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ createVideo: ["delete"] }),
  validator("param", createVideoSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create video session not found" }, 404)
      }

      await db
        .delete(createVideoSession)
        .where(
          and(
            eq(createVideoSession.id, id),
            eq(createVideoSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies CreateVideoSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete create video session" }, 500)
    }
  }
)

createVideoRoutes.post(
  "/sessions/:id/turns",
  requireOrganization,
  requirePermission({ createVideo: ["create"] }),
  validator("param", createVideoSessionIdParamsSchema),
  validator("json", createVideoTurnRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create video session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const now = new Date()
      const turn = await insertTurn(id, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create video turn" }, 500)
      }

      await db
        .update(createVideoSession)
        .set({ updatedAt: now })
        .where(eq(createVideoSession.id, id))

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Create video turn failed", error)
      })

      return c.json(turn satisfies CreatedVideoResponse, 201)
    } catch {
      return c.json({ error: "Failed to create video turn" }, 500)
    }
  }
)

createVideoRoutes.post(
  "/uploads",
  requireOrganization,
  requirePermission({ createVideo: ["create"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const body = await c.req.parseBody()
      const file = body.file

      if (!(file instanceof File)) {
        return c.json({ error: "File is required" }, 400)
      }

      if (file.size > maxUploadBytes) {
        return c.json({ error: "File must be 20MB or smaller" }, 400)
      }

      if (!allowedFrameTypes.has(file.type)) {
        return c.json(
          { error: "Start and end frames must be JPEG, PNG, or WebP" },
          400
        )
      }

      const url = await uploadVideoFrame({
        organizationId,
        assetId: crypto.randomUUID(),
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      })

      return c.json({ url } satisfies CreateVideoUploadResponse, 201)
    } catch {
      return c.json({ error: "Failed to upload file" }, 500)
    }
  }
)

async function insertTurn(
  sessionId: string,
  payload: CreateVideoTurnRequest,
  createdAt: Date
) {
  const [turn] = await db
    .insert(createdVideo)
    .values({
      id: crypto.randomUUID(),
      sessionId,
      prompt: payload.prompt,
      model: payload.model,
      aspectRatio: payload.aspectRatio,
      duration: payload.duration,
      resolution: payload.resolution ?? null,
      generateAudio: payload.generateAudio,
      startFrameUrl: payload.startFrameUrl ?? null,
      endFrameUrl: payload.endFrameUrl ?? null,
      status: "pending",
      createdAt,
    })
    .returning()

  return turn ?? null
}

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(createVideoSession)
    .where(
      and(
        eq(createVideoSession.id, id),
        eq(createVideoSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionTurns(sessionId: string) {
  return db
    .select()
    .from(createdVideo)
    .where(eq(createdVideo.sessionId, sessionId))
    .orderBy(asc(createdVideo.createdAt))
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
    .from(createdVideo)
    .where(eq(createdVideo.id, turnId))

  if (!turn) {
    return
  }

  try {
    const generated = await generateFalVideo({
      modelId: turn.model,
      prompt: turn.prompt,
      aspectRatio: turn.aspectRatio,
      duration: turn.duration,
      resolution: turn.resolution,
      generateAudio: turn.generateAudio,
      startFrameUrl: turn.startFrameUrl,
      endFrameUrl: turn.endFrameUrl,
    })
    const url = await uploadCreatedVideo({
      organizationId,
      turnId: turn.id,
      body: generated.body,
      contentType: generated.contentType,
    })

    await db
      .update(createdVideo)
      .set({
        status: "completed",
        url,
        error: null,
        falRequestId: generated.requestId,
      })
      .where(eq(createdVideo.id, turn.id))
  } catch (error) {
    await db
      .update(createdVideo)
      .set({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Create video turn failed",
      })
      .where(eq(createdVideo.id, turn.id))
  }

  await db
    .update(createVideoSession)
    .set({ updatedAt: new Date() })
    .where(eq(createVideoSession.id, turn.sessionId))
}
