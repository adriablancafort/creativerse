import { z } from "zod"

import {
  editImageAspectRatios,
  editImageModelAspectRatios,
  editImageModelIds,
  editImageModelResolutions,
  editImageResolutions,
  getEditImageModel,
} from "./models"

const promptSchema = z
  .string()
  .trim()
  .min(1, "Prompt is required")
  .max(2000, "Prompt must be 2000 characters or fewer")

export const editImageModelIdSchema = z.enum(editImageModelIds)

export const editImageAspectRatioSchema = z.enum(editImageAspectRatios)

export const editImageResolutionSchema = z.enum(editImageResolutions)

export const editImageTurnRequestSchema = z
  .object({
    prompt: promptSchema,
    model: editImageModelIdSchema,
    aspectRatio: editImageAspectRatioSchema,
    sourceUrl: z.string().url("Must be a valid URL"),
    resolution: editImageResolutionSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const model = getEditImageModel(value.model)
    const aspectRatios = editImageModelAspectRatios(model)
    const resolutions = editImageModelResolutions(model)

    if (!aspectRatios.includes(value.aspectRatio)) {
      ctx.addIssue({
        code: "custom",
        path: ["aspectRatio"],
        message: `${model.name} does not support ${value.aspectRatio}`,
      })
    }

    if (resolutions.length > 0) {
      if (
        !value.resolution ||
        !(resolutions as readonly string[]).includes(value.resolution)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["resolution"],
          message: `${model.name} requires a supported resolution`,
        })
      }
    } else if (value.resolution) {
      ctx.addIssue({
        code: "custom",
        path: ["resolution"],
        message: `${model.name} does not support resolution`,
      })
    }
  })

export const editImageSessionRequestSchema = editImageTurnRequestSchema

export const editImageSessionIdParamsSchema = z.object({
  id: z.string().min(1, "Session id is required"),
})
