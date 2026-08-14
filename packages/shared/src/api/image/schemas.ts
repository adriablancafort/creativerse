import { z } from "zod"

import {
  getImageModel,
  imageAspectRatios,
  imageModelAspectRatios,
  imageModelIds,
} from "./models"

const promptSchema = z
  .string()
  .trim()
  .min(1, "Prompt is required")
  .max(2000, "Prompt must be 2000 characters or fewer")

export const imageModelIdSchema = z.enum(imageModelIds)

export const imageAspectRatioSchema = z.enum(imageAspectRatios)

export const imageCountSchema = z
  .number()
  .int("Count must be a whole number")
  .min(1, "Generate at least 1 image")
  .max(4, "Generate at most 4 images")

export const createImageGenerationRequestSchema = z
  .object({
    prompt: promptSchema,
    model: imageModelIdSchema,
    aspectRatio: imageAspectRatioSchema,
    count: imageCountSchema,
  })
  .superRefine((value, ctx) => {
    const model = getImageModel(value.model)

    if (value.count > model.maxCount) {
      ctx.addIssue({
        code: "custom",
        path: ["count"],
        message: `Generate at most ${model.maxCount} images with ${model.name}`,
      })
    }

    if (!imageModelAspectRatios(model).includes(value.aspectRatio)) {
      ctx.addIssue({
        code: "custom",
        path: ["aspectRatio"],
        message: `${model.name} does not support ${value.aspectRatio}`,
      })
    }
  })

export const createImageSessionRequestSchema =
  createImageGenerationRequestSchema

export const imageSessionIdParamsSchema = z.object({
  id: z.string().min(1, "Session id is required"),
})
