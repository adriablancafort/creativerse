import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import {
  createdImage,
  createImageSession,
  createImageTurn,
} from "@workspace/db/schema/create-image"
import { imageSessionTitleFromPrompt } from "@workspace/shared/api/create-image/models"
import {
  createImageSessionIdParamsSchema,
  createImageSessionRequestSchema,
  createImageTurnRequestSchema,
} from "@workspace/shared/api/create-image/schemas"
import type {
  CreateImageSessionListResponse,
  CreateImageSessionResponse,
  CreateImageTurnResponse,
} from "@workspace/shared/api/create-image/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalImage } from "@/lib/create-image/fal"
import { uploadCreatedImage } from "@/lib/storage"
import { validator } from "@/lib/validator"

export const createImageRoutes = new Hono()

createImageRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ createImage: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(createImageSession)
        .where(eq(createImageSession.organizationId, organizationId))
        .orderBy(desc(createImageSession.updatedAt))

      return c.json(sessions satisfies CreateImageSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load create image sessions" }, 500)
    }
  }
)

createImageRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ createImage: ["create"] }),
  validator("json", createImageSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const turnId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(createImageSession)
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

      const [turn] = await db
        .insert(createImageTurn)
        .values({
          id: turnId,
          sessionId,
          prompt: payload.prompt,
          model: payload.model,
          aspectRatio: payload.aspectRatio,
          count: payload.count,
          createdAt: now,
        })
        .returning()

      if (!turn) {
        return c.json({ error: "Failed to create image turn" }, 500)
      }

      const images = await db
        .insert(createdImage)
        .values(
          Array.from({ length: payload.count }, (_, index) => ({
            id: crypto.randomUUID(),
            turnId,
            index,
            status: "pending",
          }))
        )
        .returning()

      runTurn(turnId, organizationId).catch((error) => {
        console.error("Create image turn failed", error)
      })

      return c.json(
        {
          ...session,
          turns: [{ ...turn, images }],
        } satisfies CreateImageSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create image session" }, 500)
    }
  }
)

createImageRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ createImage: ["read"] }),
  validator("param", createImageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create image session not found" }, 404)
      }

      return c.json(session satisfies CreateImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to load create image session" }, 500)
    }
  }
)

createImageRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ createImage: ["delete"] }),
  validator("param", createImageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create image session not found" }, 404)
      }

      await db
        .delete(createImageSession)
        .where(
          and(
            eq(createImageSession.id, id),
            eq(createImageSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies CreateImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete create image session" }, 500)
    }
  }
)

createImageRoutes.post(
  "/sessions/:id/turns",
  requireOrganization,
  requirePermission({ createImage: ["create"] }),
  validator("param", createImageSessionIdParamsSchema),
  validator("json", createImageTurnRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Create image session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const turnId = crypto.randomUUID()
      const now = new Date()

      const [turn] = await db
        .insert(createImageTurn)
        .values({
          id: turnId,
          sessionId: id,
          prompt: payload.prompt,
          model: payload.model,
          aspectRatio: payload.aspectRatio,
          count: payload.count,
          createdAt: now,
        })
        .returning()

      if (!turn) {
        return c.json({ error: "Failed to create image turn" }, 500)
      }

      const images = await db
        .insert(createdImage)
        .values(
          Array.from({ length: payload.count }, (_, index) => ({
            id: crypto.randomUUID(),
            turnId,
            index,
            status: "pending",
          }))
        )
        .returning()

      await db
        .update(createImageSession)
        .set({ updatedAt: now })
        .where(eq(createImageSession.id, id))

      runTurn(turnId, organizationId).catch((error) => {
        console.error("Create image turn failed", error)
      })

      return c.json({ ...turn, images } satisfies CreateImageTurnResponse, 201)
    } catch {
      return c.json({ error: "Failed to create image turn" }, 500)
    }
  }
)

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(createImageSession)
    .where(
      and(
        eq(createImageSession.id, id),
        eq(createImageSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionTurns(sessionId: string) {
  const turns = await db
    .select()
    .from(createImageTurn)
    .where(eq(createImageTurn.sessionId, sessionId))
    .orderBy(asc(createImageTurn.createdAt))

  if (turns.length === 0) {
    return []
  }

  const images = await db
    .select()
    .from(createdImage)
    .where(
      inArray(
        createdImage.turnId,
        turns.map((turn) => turn.id)
      )
    )
    .orderBy(asc(createdImage.index))

  return turns.map((turn) => ({
    ...turn,
    images: images.filter((image) => image.turnId === turn.id),
  }))
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
    .from(createImageTurn)
    .where(eq(createImageTurn.id, turnId))

  if (!turn) {
    return
  }

  const images = await db
    .select()
    .from(createdImage)
    .where(eq(createdImage.turnId, turnId))
    .orderBy(asc(createdImage.index))

  await Promise.all(
    images.map(async (image) => {
      try {
        const generated = await generateFalImage({
          modelId: turn.model,
          prompt: turn.prompt,
          aspectRatio: turn.aspectRatio,
        })
        const url = await uploadCreatedImage({
          organizationId,
          turnId: turn.id,
          imageId: image.id,
          body: generated.body,
          contentType: generated.contentType,
        })

        await db
          .update(createdImage)
          .set({
            status: "completed",
            url,
            error: null,
          })
          .where(eq(createdImage.id, image.id))
      } catch (error) {
        await db
          .update(createdImage)
          .set({
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Create image turn failed",
          })
          .where(eq(createdImage.id, image.id))
      }
    })
  )

  await db
    .update(createImageSession)
    .set({ updatedAt: new Date() })
    .where(eq(createImageSession.id, turn.sessionId))
}
