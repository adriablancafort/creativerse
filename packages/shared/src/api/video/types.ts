import type { z } from "zod"

import type { createVideoGenerationRequestSchema } from "./schemas"

export type VideoGeneration = {
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

export type VideoSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  generations: VideoGeneration[]
}

export type VideoGenerationResponse = VideoGeneration
export type VideoSessionListResponse = Omit<VideoSession, "generations">[]
export type VideoSessionResponse = VideoSession
export type VideoUploadResponse = { url: string }
export type CreateVideoGenerationRequest = z.infer<
  typeof createVideoGenerationRequestSchema
>
export type CreateVideoSessionRequest = CreateVideoGenerationRequest
