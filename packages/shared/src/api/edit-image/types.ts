import type { z } from "zod"

import type { editImageTurnRequestSchema } from "./schemas"

export type EditedImage = {
  id: string
  sessionId: string
  prompt: string
  model: string
  aspectRatio: string
  sourceUrl: string
  resolution: string | null
  status: string
  url: string | null
  error: string | null
  falRequestId: string | null
  createdAt: Date
}

export type EditImageSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  turns: EditedImage[]
}

export type EditedImageResponse = EditedImage
export type EditImageSessionListResponse = Omit<EditImageSession, "turns">[]
export type EditImageSessionResponse = EditImageSession
export type EditImageUploadResponse = {
  url: string
}
export type EditImageTurnRequest = z.infer<typeof editImageTurnRequestSchema>
export type EditImageSessionRequest = EditImageTurnRequest
