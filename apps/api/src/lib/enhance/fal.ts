import { fal } from "@fal-ai/client"
import { z } from "zod"

import {
  type EnhanceModel,
  enhanceModelShowsCreativity,
  enhanceModelShowsDetail,
  enhanceModelShowsNoiseScale,
  enhanceModelShowsPrompt,
  enhanceModelShowsShapePreservation,
  enhanceModelShowsTargetFps,
  enhanceModelTopazModels,
  enhanceModelUpscaleModes,
  getEnhanceModel,
} from "@workspace/shared/api/enhance/models"
import { env } from "@/lib/env"

fal.config({
  credentials: env.FAL_KEY,
})

const falImageResultSchema = z.object({
  image: z.object({
    url: z.string(),
    content_type: z.string().optional(),
  }),
})

const falVideoResultSchema = z.object({
  video: z.object({
    url: z.string(),
    content_type: z.string().optional(),
  }),
})

export type EnhanceFalOptions = {
  modelId: string
  mediaType: "image" | "video"
  sourceUrl: string
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
}

function buildInput(model: EnhanceModel, options: EnhanceFalOptions) {
  const input: Record<string, unknown> = {
    ...model.fal.extra,
  }

  if (model.mediaType === "image" && model.fal.imageUrlField) {
    input[model.fal.imageUrlField] = options.sourceUrl
  }

  if (model.mediaType === "video" && model.fal.videoUrlField) {
    input[model.fal.videoUrlField] = options.sourceUrl
  }

  if (enhanceModelShowsPrompt(model) && options.prompt) {
    input.prompt = options.prompt
  }

  const upscaleModes = enhanceModelUpscaleModes(model)

  if (upscaleModes.length > 0 && options.upscaleMode) {
    input.upscale_mode = options.upscaleMode

    if (options.upscaleMode === "factor" && options.scale != null) {
      input.upscale_factor = options.scale
    }

    if (options.upscaleMode === "target" && options.targetResolution) {
      input.target_resolution = options.targetResolution
    }
  } else if (options.scale != null) {
    if (enhanceModelTopazModels(model).length > 0) {
      input.upscale_factor = options.scale
    } else {
      input.scale = options.scale
    }
  }

  if (enhanceModelShowsCreativity(model) && options.creativity != null) {
    input.creativity = options.creativity
  }

  if (enhanceModelShowsDetail(model) && options.detail != null) {
    input.detail = options.detail
  }

  if (
    enhanceModelShowsShapePreservation(model) &&
    options.shapePreservation != null
  ) {
    input.shape_preservation = options.shapePreservation
  }

  if (enhanceModelShowsNoiseScale(model) && options.noiseScale != null) {
    input.noise_scale = options.noiseScale
  }

  if (enhanceModelTopazModels(model).length > 0 && options.topazModel) {
    input.model = options.topazModel
  }

  if (enhanceModelShowsTargetFps(model) && options.targetFps != null) {
    input.target_fps = options.targetFps
  }

  return input
}

export async function generateFalEnhance(options: EnhanceFalOptions) {
  const model = getEnhanceModel(options.modelId)

  if (model.mediaType !== options.mediaType) {
    throw new Error(`${model.name} does not support ${options.mediaType}`)
  }

  const result = await fal.subscribe(model.fal.endpoint, {
    input: buildInput(model, options),
  })

  if (options.mediaType === "video") {
    const video = falVideoResultSchema.parse(result.data).video
    const download = await fetch(video.url)

    if (!download.ok) {
      throw new Error("Failed to download enhanced video")
    }

    return {
      body: Buffer.from(await download.arrayBuffer()),
      contentType:
        video.content_type ??
        download.headers.get("content-type") ??
        "video/mp4",
      requestId: result.requestId,
      mediaType: "video" as const,
    }
  }

  const image = falImageResultSchema.parse(result.data).image
  const download = await fetch(image.url)

  if (!download.ok) {
    throw new Error("Failed to download enhanced image")
  }

  return {
    body: Buffer.from(await download.arrayBuffer()),
    contentType:
      image.content_type ?? download.headers.get("content-type") ?? "image/png",
    requestId: result.requestId,
    mediaType: "image" as const,
  }
}
