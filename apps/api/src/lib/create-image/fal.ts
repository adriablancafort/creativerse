import { fal } from "@fal-ai/client"
import { z } from "zod"

import {
  getImageModel,
  type ImageAspectRatio,
  type ImageModel,
} from "@workspace/shared/api/create-image/models"
import { env } from "@/lib/env"

fal.config({
  credentials: env.FAL_KEY,
})

const falResultSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string(),
        content_type: z.string().optional(),
      })
    )
    .min(1),
})

const presetSize: Record<string, string | { width: number; height: number }> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
}

const pixelSize: Record<string, { width: number; height: number }> = {
  "1:1": { width: 2048, height: 2048 },
  "16:9": { width: 2560, height: 1440 },
  "9:16": { width: 1440, height: 2560 },
  "4:3": { width: 2304, height: 1728 },
  "3:4": { width: 1728, height: 2304 },
  "3:2": { width: 2496, height: 1664 },
  "2:3": { width: 1664, height: 2496 },
}

function buildInput(
  model: ImageModel,
  prompt: string,
  aspectRatio: ImageAspectRatio
) {
  const input: Record<string, unknown> = {
    prompt,
    ...model.fal.extra,
  }

  if (model.fal.size === "aspect_ratio") {
    input.aspect_ratio = aspectRatio
    return input
  }

  if (model.fal.size === "pixels") {
    input.image_size = pixelSize[aspectRatio] ?? pixelSize["1:1"]
    return input
  }

  input.image_size = presetSize[aspectRatio] ?? "square_hd"
  return input
}

export async function generateFalImage(options: {
  modelId: string
  prompt: string
  aspectRatio: string
}) {
  const model = getImageModel(options.modelId)
  const result = await fal.subscribe(model.fal.endpoint, {
    input: buildInput(
      model,
      options.prompt,
      options.aspectRatio as ImageAspectRatio
    ),
  })
  const image = falResultSchema.parse(result.data).images[0]

  if (!image) {
    throw new Error("Fal returned no images")
  }

  const download = await fetch(image.url)

  if (!download.ok) {
    throw new Error("Failed to download generated image")
  }

  return {
    body: Buffer.from(await download.arrayBuffer()),
    contentType:
      image.content_type ?? download.headers.get("content-type") ?? "image/png",
  }
}
