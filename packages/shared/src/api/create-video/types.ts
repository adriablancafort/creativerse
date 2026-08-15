import type { z } from "zod"

import type { createVideoTurnRequestSchema } from "./schemas"

export type CreatedVideo = {
  id: string
  sessionId: string
  prompt: string
  model: string
  aspectRatio: string
  duration: number
  resolution: string | null
  generateAudio: boolean
  startFrameUrl: string | null
  endFrameUrl: string | null
  status: string
  url: string | null
  error: string | null
  falRequestId: string | null
  createdAt: Date
}

export type CreateVideoSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  turns: CreatedVideo[]
}

export type CreatedVideoResponse = CreatedVideo
export type CreateVideoSessionListResponse = Omit<CreateVideoSession, "turns">[]
export type CreateVideoSessionResponse = CreateVideoSession
export type CreateVideoUploadResponse = { url: string }
export type CreateVideoTurnRequest = z.infer<
  typeof createVideoTurnRequestSchema
>
export type CreateVideoSessionRequest = CreateVideoTurnRequest
