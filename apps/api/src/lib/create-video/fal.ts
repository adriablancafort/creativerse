import { fal } from "@fal-ai/client"
import { z } from "zod"

import {
  formatFalDuration,
  getVideoModel,
  type VideoModel,
  videoModelResolutions,
  videoModelShowsAspectRatio,
  videoModelSupportsAudio,
} from "@workspace/shared/api/create-video/models"
import { env } from "@/lib/env"

fal.config({
  credentials: env.FAL_KEY,
})

const falResultSchema = z.object({
  video: z.object({
    url: z.string(),
    content_type: z.string().optional(),
  }),
})

function buildInput(
  model: VideoModel,
  options: {
    prompt: string
    aspectRatio: string
    duration: number
    resolution: string | null
    generateAudio: boolean
    startFrameUrl: string | null
    endFrameUrl: string | null
  }
) {
  const input: Record<string, unknown> = {
    prompt: options.prompt,
  }

  input.duration = formatFalDuration(model.fal.durationFormat, options.duration)

  if (videoModelShowsAspectRatio(model, Boolean(options.startFrameUrl))) {
    input.aspect_ratio = options.aspectRatio
  }

  if (videoModelResolutions(model).length > 0 && options.resolution) {
    input.resolution = options.resolution
  }

  if (videoModelSupportsAudio(model)) {
    input.generate_audio = options.generateAudio
  }

  if (options.startFrameUrl && model.fal.imageUrlField) {
    input[model.fal.imageUrlField] = options.startFrameUrl
  }

  if (options.endFrameUrl && model.fal.endImageUrlField) {
    input[model.fal.endImageUrlField] = options.endFrameUrl
  }

  return input
}

function resolveEndpoint(
  model: VideoModel,
  startFrameUrl: string | null,
  endFrameUrl: string | null
) {
  if (startFrameUrl && endFrameUrl && model.fal.firstLastFrame) {
    return model.fal.firstLastFrame
  }

  if (startFrameUrl) {
    if (!model.fal.imageToVideo) {
      throw new Error(`${model.name} does not support a start frame`)
    }

    return model.fal.imageToVideo
  }

  if (!model.fal.textToVideo) {
    throw new Error(`${model.name} requires a start frame`)
  }

  return model.fal.textToVideo
}

export async function generateFalVideo(options: {
  modelId: string
  prompt: string
  aspectRatio: string
  duration: number
  resolution: string | null
  generateAudio: boolean
  startFrameUrl: string | null
  endFrameUrl: string | null
}) {
  const model = getVideoModel(options.modelId)
  const endpoint = resolveEndpoint(
    model,
    options.startFrameUrl,
    options.endFrameUrl
  )
  const result = await fal.subscribe(endpoint.endpoint, {
    input: {
      ...endpoint.extra,
      ...buildInput(model, options),
    },
  })
  const video = falResultSchema.parse(result.data).video
  const download = await fetch(video.url)

  if (!download.ok) {
    throw new Error("Failed to download generated video")
  }

  return {
    body: Buffer.from(await download.arrayBuffer()),
    contentType:
      video.content_type ?? download.headers.get("content-type") ?? "video/mp4",
    requestId: result.requestId,
  }
}
