import { z } from "zod"

import {
  getVideoModel,
  videoAspectRatios,
  videoModelAspectRatios,
  videoModelDurations,
  videoModelIds,
  videoModelResolutions,
  videoModelSupportsAudio,
  videoModelSupportsEndFrame,
  videoModelSupportsImageToVideo,
  videoModelSupportsTextToVideo,
} from "./models"

const promptSchema = z
  .string()
  .trim()
  .min(1, "Prompt is required")
  .max(2000, "Prompt must be 2000 characters or fewer")

const optionalUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .nullable()
  .optional()

export const videoModelIdSchema = z.enum(videoModelIds)

export const videoAspectRatioSchema = z.enum(videoAspectRatios)

export const createVideoTurnRequestSchema = z
  .object({
    prompt: promptSchema,
    model: videoModelIdSchema,
    aspectRatio: videoAspectRatioSchema,
    duration: z.number().int("Duration must be a whole number"),
    resolution: z.string().nullable().optional(),
    generateAudio: z.boolean(),
    startFrameUrl: optionalUrlSchema,
    endFrameUrl: optionalUrlSchema,
  })
  .superRefine((value, ctx) => {
    const model = getVideoModel(value.model)
    const aspectRatios = videoModelAspectRatios(model)
    const durations = videoModelDurations(model)
    const resolutions = videoModelResolutions(model)
    const startFrameUrl = value.startFrameUrl ?? null
    const endFrameUrl = value.endFrameUrl ?? null

    if (!durations.includes(value.duration)) {
      ctx.addIssue({
        code: "custom",
        path: ["duration"],
        message: `${model.name} does not support ${value.duration}s`,
      })
    }

    if (aspectRatios.length > 0 && !aspectRatios.includes(value.aspectRatio)) {
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

    if (value.generateAudio && !videoModelSupportsAudio(model)) {
      ctx.addIssue({
        code: "custom",
        path: ["generateAudio"],
        message: `${model.name} does not support audio`,
      })
    }

    if (startFrameUrl && !videoModelSupportsImageToVideo(model)) {
      ctx.addIssue({
        code: "custom",
        path: ["startFrameUrl"],
        message: `${model.name} does not support a start frame`,
      })
    }

    if (!startFrameUrl && !videoModelSupportsTextToVideo(model)) {
      ctx.addIssue({
        code: "custom",
        path: ["startFrameUrl"],
        message: `${model.name} requires a start frame`,
      })
    }

    if (endFrameUrl && !videoModelSupportsEndFrame(model)) {
      ctx.addIssue({
        code: "custom",
        path: ["endFrameUrl"],
        message: `${model.name} does not support an end frame`,
      })
    }

    if (endFrameUrl && !startFrameUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["endFrameUrl"],
        message: "End frame requires a start frame",
      })
    }
  })

export const createVideoSessionRequestSchema = createVideoTurnRequestSchema

export const createVideoSessionIdParamsSchema = z.object({
  id: z.string().min(1, "Session id is required"),
})
