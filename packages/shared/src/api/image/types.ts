import type { z } from "zod"

import type { createImageGenerationRequestSchema } from "./schemas"

export type GeneratedImage = {
  id: string
  generationId: string
  index: number
  status: string
  url: string | null
  error: string | null
}

export type ImageGeneration = {
  id: string
  sessionId: string
  prompt: string
  model: string
  aspectRatio: string
  count: number
  createdAt: Date
  images: GeneratedImage[]
}

export type ImageSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  generations: ImageGeneration[]
}

export type ImageGenerationResponse = ImageGeneration
export type ImageSessionListResponse = Omit<ImageSession, "generations">[]
export type ImageSessionResponse = ImageSession
export type CreateImageGenerationRequest = z.infer<
  typeof createImageGenerationRequestSchema
>
export type CreateImageSessionRequest = CreateImageGenerationRequest
