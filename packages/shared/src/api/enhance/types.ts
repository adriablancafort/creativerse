import type { z } from "zod"

import type { createEnhanceTurnRequestSchema } from "./schemas"

export type CreatedEnhance = {
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
  turns: CreatedEnhance[]
}

export type CreatedEnhanceResponse = CreatedEnhance
export type EnhanceSessionListResponse = Omit<EnhanceSession, "turns">[]
export type EnhanceSessionResponse = EnhanceSession
export type EnhanceUploadResponse = {
  url: string
  mediaType: "image" | "video"
}
export type CreateEnhanceTurnRequest = z.infer<
  typeof createEnhanceTurnRequestSchema
>
export type CreateEnhanceSessionRequest = CreateEnhanceTurnRequest
