import { and, asc, desc, eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db/client"
import { editedImage, editImageSession } from "@workspace/db/schema/edit-image"
import { editImageSessionTitleFromPrompt } from "@workspace/shared/api/edit-image/models"
import {
  editImageSessionIdParamsSchema,
  editImageSessionRequestSchema,
  editImageTurnRequestSchema,
} from "@workspace/shared/api/edit-image/schemas"
import type {
  EditedImageResponse,
  EditImageSessionListResponse,
  EditImageSessionResponse,
  EditImageTurnRequest,
  EditImageUploadResponse,
} from "@workspace/shared/api/edit-image/types"
import { requireOrganization } from "@/lib/auth/organization"
import { requirePermission } from "@/lib/auth/permissions"
import { generateFalEditImage } from "@/lib/edit-image/fal"
import { uploadEditedImage, uploadEditImageSource } from "@/lib/storage"
import { validator } from "@/lib/validator"

const maxUploadBytes = 20 * 1024 * 1024
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export const editImageRoutes = new Hono()

editImageRoutes.get(
  "/sessions",
  requireOrganization,
  requirePermission({ editImage: ["read"] }),
  async (c) => {
    const organizationId = c.get("organizationId")

    try {
      const sessions = await db
        .select()
        .from(editImageSession)
        .where(eq(editImageSession.organizationId, organizationId))
        .orderBy(desc(editImageSession.updatedAt))

      return c.json(sessions satisfies EditImageSessionListResponse)
    } catch {
      return c.json({ error: "Failed to load edit image sessions" }, 500)
    }
  }
)

editImageRoutes.post(
  "/sessions",
  requireOrganization,
  requirePermission({ editImage: ["create"] }),
  validator("json", editImageSessionRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const userId = c.get("userId")

    try {
      const payload = c.req.valid("json")
      const sessionId = crypto.randomUUID()
      const now = new Date()

      const [session] = await db
        .insert(editImageSession)
        .values({
          id: sessionId,
          organizationId,
          userId,
          title: editImageSessionTitleFromPrompt(payload.prompt),
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      if (!session) {
        return c.json({ error: "Failed to create edit image session" }, 500)
      }

      const turn = await insertTurn(sessionId, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create edit image turn" }, 500)
      }

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Edit image turn failed", error)
      })

      return c.json(
        {
          ...session,
          turns: [turn],
        } satisfies EditImageSessionResponse,
        201
      )
    } catch {
      return c.json({ error: "Failed to create edit image session" }, 500)
    }
  }
)

editImageRoutes.get(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ editImage: ["read"] }),
  validator("param", editImageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Edit image session not found" }, 404)
      }

      return c.json(session satisfies EditImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to load edit image session" }, 500)
    }
  }
)

editImageRoutes.delete(
  "/sessions/:id",
  requireOrganization,
  requirePermission({ editImage: ["delete"] }),
  validator("param", editImageSessionIdParamsSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await loadOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Edit image session not found" }, 404)
      }

      await db
        .delete(editImageSession)
        .where(
          and(
            eq(editImageSession.id, id),
            eq(editImageSession.organizationId, organizationId)
          )
        )

      return c.json(session satisfies EditImageSessionResponse)
    } catch {
      return c.json({ error: "Failed to delete edit image session" }, 500)
    }
  }
)

editImageRoutes.post(
  "/sessions/:id/turns",
  requireOrganization,
  requirePermission({ editImage: ["create"] }),
  validator("param", editImageSessionIdParamsSchema),
  validator("json", editImageTurnRequestSchema),
  async (c) => {
    const organizationId = c.get("organizationId")
    const { id } = c.req.valid("param")

    try {
      const session = await findOrganizationSession(organizationId, id)

      if (!session) {
        return c.json({ error: "Edit image session not found" }, 404)
      }

      const payload = c.req.valid("json")
      const now = new Date()
      const turn = await insertTurn(id, payload, now)

      if (!turn) {
        return c.json({ error: "Failed to create edit image turn" }, 500)
      }

      await db
        .update(editImageSession)
        .set({ updatedAt: now })
        .where(eq(editImageSession.id, id))

      runTurn(turn.id, organizationId).catch((error) => {
        console.error("Edit image turn failed", error)
      })

      return c.json(turn satisfies EditedImageResponse, 201)
    } catch {
      return c.json({ error: "Failed to create edit image turn" }, 500)
    }
  }
)

editImageRoutes.post(
  "/uploads",
  requireOrganization,
  requirePermission({ editImage: ["create"] }),
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

      if (!allowedImageTypes.has(file.type)) {
        return c.json({ error: "Images must be JPEG, PNG, or WebP" }, 400)
      }

      const url = await uploadEditImageSource({
        organizationId,
        assetId: crypto.randomUUID(),
        body: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      })

      return c.json({ url } satisfies EditImageUploadResponse, 201)
    } catch {
      return c.json({ error: "Failed to upload image" }, 500)
    }
  }
)

async function insertTurn(
  sessionId: string,
  payload: EditImageTurnRequest,
  createdAt: Date
) {
  const [turn] = await db
    .insert(editedImage)
    .values({
      id: crypto.randomUUID(),
      sessionId,
      prompt: payload.prompt,
      model: payload.model,
      aspectRatio: payload.aspectRatio,
      sourceUrl: payload.sourceUrl,
      resolution: payload.resolution ?? null,
      status: "pending",
      createdAt,
    })
    .returning()

  return turn ?? null
}

async function findOrganizationSession(organizationId: string, id: string) {
  const [session] = await db
    .select()
    .from(editImageSession)
    .where(
      and(
        eq(editImageSession.id, id),
        eq(editImageSession.organizationId, organizationId)
      )
    )

  return session ?? null
}

async function loadSessionTurns(sessionId: string) {
  return db
    .select()
    .from(editedImage)
    .where(eq(editedImage.sessionId, sessionId))
    .orderBy(asc(editedImage.createdAt))
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
    .from(editedImage)
    .where(eq(editedImage.id, turnId))

  if (!turn) {
    return
  }

  try {
    const generated = await generateFalEditImage({
      modelId: turn.model,
      prompt: turn.prompt,
      aspectRatio: turn.aspectRatio,
      sourceUrl: turn.sourceUrl,
      resolution: turn.resolution,
    })
    const url = await uploadEditedImage({
      organizationId,
      turnId: turn.id,
      body: generated.body,
      contentType: generated.contentType,
    })

    await db
      .update(editedImage)
      .set({
        status: "completed",
        url,
        error: null,
        falRequestId: generated.requestId,
      })
      .where(eq(editedImage.id, turn.id))
  } catch (error) {
    await db
      .update(editedImage)
      .set({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Edit image turn failed",
      })
      .where(eq(editedImage.id, turn.id))
  }

  await db
    .update(editImageSession)
    .set({ updatedAt: new Date() })
    .where(eq(editImageSession.id, turn.sessionId))
}
