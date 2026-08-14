import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import {
  generatedImage,
  imageGeneration,
  imageSession,
} from "@workspace/db/schema/image"
import { imageSessionTitleFromPrompt } from "@workspace/shared/api/image/models"
import {
  createImageGenerationRequestSchema,
  createImageSessionRequestSchema,
  imageSessionIdParamsSchema,
} from "@workspace/shared/api/image/schemas"
import type {
  ImageGenerationResponse,
  ImageSessionListResponse,
  ImageSessionResponse,
} from "@workspace/shared/api/image/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalImage } from "@/lib/image/fal"
import { uploadGeneratedImage } from "@/lib/storage"
import { validator } from "@/lib/validator"

export const imageRoutes = new Hono()

imageRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ image: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(imageSession)
        .where(eq(imageSession.organizationId, organizationId))
        .orderBy(desc(imageSession.updatedAt))

      return c.json(sessions satisfies ImageSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load image sessions" }, 500)
    }
  }
)

imageRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ image: ["create"] }),
  validator("json", createImageSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const generationId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(imageSession)
        .values({
          id: sessionId,
          organizationId,
          userId,
          title: imageSessionTitleFromPrompt(payload.prompt),
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      if (!session) {
        return c.json({ error: "Failed to create image session" }, 500)
      }

      const [generation] = await db
        .insert(imageGeneration)
        .values({
          id: generationId,
          sessionId,
          prompt: payload.prompt,
          model: payload.model,
          aspectRatio: payload.aspectRatio,
          count: payload.count,
          createdAt: now,
        })
        .returning()

      if (!generation) {
        return c.json({ error: "Failed to create image generation" }, 500)
      }

      const images = await db
        .insert(generatedImage)
        .values(
          Array.from({ length: payload.count }, (_, index) => ({
            id: crypto.randomUUID(),
            generationId,
            index,
            status: "pending",
          }))
        )
        .returning()

      runGeneration(generationId, organizationId).catch((error) => {
        console.error("Image generation failed", error)
      })

      return c.json(
        {
          ...session,
          generations: [{ ...generation, images }],
        } satisfies ImageSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create image session" }, 500)
    }
  }
)

imageRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ image: ["read"] }),
  validator("param", imageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Image session not found" }, 404)
      }

      return c.json(session satisfies ImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to load image session" }, 500)
    }
  }
)

imageRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ image: ["delete"] }),
  validator("param", imageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Image session not found" }, 404)
      }

      await db
        .delete(imageSession)
        .where(
          and(
            eq(imageSession.id, id),
            eq(imageSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies ImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete image session" }, 500)
    }
  }
)

imageRoutes.post(
  "/sessions/:id/generations",
  requireOrganization,
  requirePermission({ image: ["create"] }),
  validator("param", imageSessionIdParamsSchema),
  validator("json", createImageGenerationRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Image session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const generationId = crypto.randomUUID()
      const now = new Date()

      const [generation] = await db
        .insert(imageGeneration)
        .values({
          id: generationId,
          sessionId: id,
          prompt: payload.prompt,
          model: payload.model,
          aspectRatio: payload.aspectRatio,
          count: payload.count,
          createdAt: now,
        })
        .returning()

      if (!generation) {
        return c.json({ error: "Failed to create image generation" }, 500)
      }

      const images = await db
        .insert(generatedImage)
        .values(
          Array.from({ length: payload.count }, (_, index) => ({
            id: crypto.randomUUID(),
            generationId,
            index,
            status: "pending",
          }))
        )
        .returning()

      await db
        .update(imageSession)
        .set({ updatedAt: now })
        .where(eq(imageSession.id, id))

      runGeneration(generationId, organizationId).catch((error) => {
        console.error("Image generation failed", error)
      })

      return c.json(
        { ...generation, images } satisfies ImageGenerationResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create image generation" }, 500)
    }
  }
)

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(imageSession)
    .where(
      and(
        eq(imageSession.id, id),
        eq(imageSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionGenerations(sessionId: string) {
  const generations = await db
    .select()
    .from(imageGeneration)
    .where(eq(imageGeneration.sessionId, sessionId))
    .orderBy(asc(imageGeneration.createdAt))

  if (generations.length === 0) {
    return []
  }

  const images = await db
    .select()
    .from(generatedImage)
    .where(
      inArray(
        generatedImage.generationId,
        generations.map((generation) => generation.id)
      )
    )
    .orderBy(asc(generatedImage.index))

  return generations.map((generation) => ({
    ...generation,
    images: images.filter((image) => image.generationId === generation.id),
  }))
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
    .from(imageGeneration)
    .where(eq(imageGeneration.id, generationId))

  if (!generation) {
    return
  }

  const images = await db
    .select()
    .from(generatedImage)
    .where(eq(generatedImage.generationId, generationId))
    .orderBy(asc(generatedImage.index))

  await Promise.all(
    images.map(async (image) => {
      try {
        const generated = await generateFalImage({
          modelId: generation.model,
          prompt: generation.prompt,
          aspectRatio: generation.aspectRatio,
        })
        const url = await uploadGeneratedImage({
          organizationId,
          generationId: generation.id,
          imageId: image.id,
          body: generated.body,
          contentType: generated.contentType,
        })

        await db
          .update(generatedImage)
          .set({
            status: "completed",
            url,
            error: null,
          })
          .where(eq(generatedImage.id, image.id))
      } catch (error) {
        await db
          .update(generatedImage)
          .set({
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Image generation failed",
          })
          .where(eq(generatedImage.id, image.id))
      }
    })
  )

  await db
    .update(imageSession)
    .set({ updatedAt: new Date() })
    .where(eq(imageSession.id, generation.sessionId))
}
