import type { z } from "zod"

import type { createImageTurnRequestSchema } from "./schemas"

export type CreatedImage = {
  id: string
  turnId: string
  index: number
  status: string
  url: string | null
  error: string | null
}

export type CreateImageTurn = {
  id: string
  sessionId: string
  prompt: string
  model: string
  aspectRatio: string
  count: number
  createdAt: Date
  images: CreatedImage[]
}

export type CreateImageSession = {
  id: string
  organizationId: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  turns: CreateImageTurn[]
}

export type CreateImageTurnResponse = CreateImageTurn
export type CreateImageSessionListResponse = Omit<CreateImageSession, "turns">[]
export type CreateImageSessionResponse = CreateImageSession
export type CreateImageTurnRequest = z.infer<
  typeof createImageTurnRequestSchema
>
export type CreateImageSessionRequest = CreateImageTurnRequest
