import { and, asc, desc, eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import { videoGeneration, videoSession } from "@workspace/db/schema/video"
import { videoSessionTitleFromPrompt } from "@workspace/shared/api/video/models"
import {
  createVideoGenerationRequestSchema,
  createVideoSessionRequestSchema,
  videoSessionIdParamsSchema,
} from "@workspace/shared/api/video/schemas"
import type {
  CreateVideoGenerationRequest,
  VideoGenerationResponse,
  VideoSessionListResponse,
  VideoSessionResponse,
  VideoUploadResponse,
} from "@workspace/shared/api/video/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { uploadGeneratedVideo, uploadVideoFrame } from "@/lib/storage"
import { validator } from "@/lib/validator"
import { generateFalVideo } from "@/lib/video/fal"

const maxUploadBytes = 20 * 1024 * 1024
const allowedFrameTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export const videoRoutes = new Hono()

videoRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ video: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(videoSession)
        .where(eq(videoSession.organizationId, organizationId))
        .orderBy(desc(videoSession.updatedAt))

      return c.json(sessions satisfies VideoSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load video sessions" }, 500)
    }
  }
)

videoRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ video: ["create"] }),
  validator("json", createVideoSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(videoSession)
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

      const generation = await insertGeneration(sessionId, payload, now)

      if (!generation) {
        return c.json({ error: "Failed to create video generation" }, 500)
      }

      runGeneration(generation.id, organizationId).catch((error) => {
        console.error("Video generation failed", error)
      })

      return c.json(
        {
          ...session,
          generations: [generation],
        } satisfies VideoSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create video session" }, 500)
    }
  }
)

videoRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ video: ["read"] }),
  validator("param", videoSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Video session not found" }, 404)
      }

      return c.json(session satisfies VideoSessionResponse)
    } catch {
      return c.json({ error: "Failed to load video session" }, 500)
    }
  }
)

videoRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ video: ["delete"] }),
  validator("param", videoSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Video session not found" }, 404)
      }

      await db
        .delete(videoSession)
        .where(
          and(
            eq(videoSession.id, id),
            eq(videoSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies VideoSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete video session" }, 500)
    }
  }
)

videoRoutes.post(
  "/sessions/:id/generations",
  requireOrganization,
  requirePermission({ video: ["create"] }),
  validator("param", videoSessionIdParamsSchema),
  validator("json", createVideoGenerationRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Video session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const now = new Date()
      const generation = await insertGeneration(id, payload, now)

      if (!generation) {
        return c.json({ error: "Failed to create video generation" }, 500)
      }

      await db
        .update(videoSession)
        .set({ updatedAt: now })
        .where(eq(videoSession.id, id))

      runGeneration(generation.id, organizationId).catch((error) => {
        console.error("Video generation failed", error)
      })

      return c.json(generation satisfies VideoGenerationResponse, 201)
    } catch {
      return c.json({ error: "Failed to create video generation" }, 500)
    }
  }
)

videoRoutes.post(
  "/uploads",
  requireOrganization,
  requirePermission({ video: ["create"] }),
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

      return c.json({ url } satisfies VideoUploadResponse, 201)
    } catch {
      return c.json({ error: "Failed to upload file" }, 500)
    }
  }
)

async function insertGeneration(
  sessionId: string,
  payload: CreateVideoGenerationRequest,
  createdAt: Date
) {
  const [generation] = await db
    .insert(videoGeneration)
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

  return generation ?? null
}

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(videoSession)
    .where(
      and(
        eq(videoSession.id, id),
        eq(videoSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionGenerations(sessionId: string) {
  return db
    .select()
    .from(videoGeneration)
    .where(eq(videoGeneration.sessionId, sessionId))
    .orderBy(asc(videoGeneration.createdAt))
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
    .from(videoGeneration)
    .where(eq(videoGeneration.id, generationId))

  if (!generation) {
    return
  }

  try {
    const generated = await generateFalVideo({
      modelId: generation.model,
      prompt: generation.prompt,
      aspectRatio: generation.aspectRatio,
      duration: generation.duration,
      resolution: generation.resolution,
      generateAudio: generation.generateAudio,
      startFrameUrl: generation.startFrameUrl,
      endFrameUrl: generation.endFrameUrl,
    })
    const url = await uploadGeneratedVideo({
      organizationId,
      generationId: generation.id,
      body: generated.body,
      contentType: generated.contentType,
    })

    await db
      .update(videoGeneration)
      .set({
        status: "completed",
        url,
        error: null,
        falRequestId: generated.requestId,
      })
      .where(eq(videoGeneration.id, generation.id))
  } catch (error) {
    await db
      .update(videoGeneration)
      .set({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Video generation failed",
      })
      .where(eq(videoGeneration.id, generation.id))
  }

  await db
    .update(videoSession)
    .set({ updatedAt: new Date() })
    .where(eq(videoSession.id, generation.sessionId))
}
