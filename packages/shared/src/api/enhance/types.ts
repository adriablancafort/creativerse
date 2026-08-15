import type { z } from "zod"

import type { createEnhanceGenerationRequestSchema } from "./schemas"

export type EnhanceGeneration = {
  id: string
  sessionId: string
  mediaType: string
  sourceUrl: string
  model: string
  prompt: string | null
  scale: number | null
  creativity: number | null
  detail: number | null
  shapePreservation: number | null
  upscaleMode: string | null
  targetResolution: string | null
  noiseScale: number | null
  topazModel: string | null
  targetFps: number | null
  status: string
  url: string | null
  error: string | null
  falRequestId: string | null
  createdAt: Date
}

export type EnhanceSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  generations: EnhanceGeneration[]
}

export type EnhanceGenerationResponse = EnhanceGeneration
export type EnhanceSessionListResponse = Omit<EnhanceSession, "generations">[]
export type EnhanceSessionResponse = EnhanceSession
export type EnhanceUploadResponse = {
  url: string
  mediaType: "image" | "video"
}
export type CreateEnhanceGenerationRequest = z.infer<
  typeof createEnhanceGenerationRequestSchema
>
export type CreateEnhanceSessionRequest = CreateEnhanceGenerationRequest
