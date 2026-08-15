import { z } from "zod"

import {
  enhanceMediaTypes,
  enhanceModelIds,
  enhanceModelScales,
  enhanceModelShowsCreativity,
  enhanceModelShowsDetail,
  enhanceModelShowsNoiseScale,
  enhanceModelShowsPrompt,
  enhanceModelShowsShapePreservation,
  enhanceModelShowsTargetFps,
  enhanceModelTargetResolutions,
  enhanceModelTopazModels,
  enhanceModelUpscaleModes,
  enhanceTargetResolutions,
  enhanceTopazModels,
  enhanceUpscaleModes,
  getEnhanceModel,
} from "./models"

const optionalPromptSchema = z
  .string()
  .trim()
  .max(2000, "Prompt must be 2000 characters or fewer")
  .nullable()
  .optional()

const sourceUrlSchema = z.string().url("Source must be a valid URL")

export const enhanceModelIdSchema = z.enum(enhanceModelIds)

export const enhanceMediaTypeSchema = z.enum(enhanceMediaTypes)

export const enhanceUpscaleModeSchema = z.enum(enhanceUpscaleModes)

export const enhanceTargetResolutionSchema = z.enum(enhanceTargetResolutions)

export const enhanceTopazModelSchema = z.enum(enhanceTopazModels)

export const createEnhanceTurnRequestSchema = z
  .object({
    mediaType: enhanceMediaTypeSchema,
    sourceUrl: sourceUrlSchema,
    model: enhanceModelIdSchema,
    prompt: optionalPromptSchema,
    scale: z.number().nullable().optional(),
    creativity: z.number().nullable().optional(),
    detail: z.number().nullable().optional(),
    shapePreservation: z.number().nullable().optional(),
    upscaleMode: enhanceUpscaleModeSchema.nullable().optional(),
    targetResolution: enhanceTargetResolutionSchema.nullable().optional(),
    noiseScale: z.number().nullable().optional(),
    topazModel: enhanceTopazModelSchema.nullable().optional(),
    targetFps: z.number().int().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const model = getEnhanceModel(value.model)

    if (model.mediaType !== value.mediaType) {
      ctx.addIssue({
        code: "custom",
        path: ["model"],
        message: `${model.name} does not support ${value.mediaType}`,
      })
    }

    const prompt = value.prompt?.trim() ?? ""

    if (prompt && !enhanceModelShowsPrompt(model)) {
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: `${model.name} does not support a prompt`,
      })
    }

    const scales = enhanceModelScales(model)

    if (scales.length > 0) {
      const needsScale =
        enhanceModelUpscaleModes(model).length === 0 ||
        value.upscaleMode === "factor" ||
        value.upscaleMode == null

      if (needsScale) {
        if (
          value.scale == null ||
          !(scales as readonly number[]).includes(value.scale)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["scale"],
            message: `${model.name} requires a supported scale`,
          })
        }
      }
    } else if (value.scale != null) {
      ctx.addIssue({
        code: "custom",
        path: ["scale"],
        message: `${model.name} does not support scale`,
      })
    }

    if (value.creativity != null) {
      if (!enhanceModelShowsCreativity(model)) {
        ctx.addIssue({
          code: "custom",
          path: ["creativity"],
          message: `${model.name} does not support creativity`,
        })
      } else if (value.creativity < 0 || value.creativity > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["creativity"],
          message: "Creativity must be between 0 and 1",
        })
      }
    }

    if (value.detail != null) {
      if (!enhanceModelShowsDetail(model)) {
        ctx.addIssue({
          code: "custom",
          path: ["detail"],
          message: `${model.name} does not support detail`,
        })
      } else if (value.detail < 0 || value.detail > 2) {
        ctx.addIssue({
          code: "custom",
          path: ["detail"],
          message: "Detail must be between 0 and 2",
        })
      }
    }

    if (value.shapePreservation != null) {
      if (!enhanceModelShowsShapePreservation(model)) {
        ctx.addIssue({
          code: "custom",
          path: ["shapePreservation"],
          message: `${model.name} does not support shape preservation`,
        })
      } else if (value.shapePreservation < 0 || value.shapePreservation > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["shapePreservation"],
          message: "Shape preservation must be between 0 and 1",
        })
      }
    }

    const upscaleModes = enhanceModelUpscaleModes(model)

    if (upscaleModes.length > 0) {
      if (
        !value.upscaleMode ||
        !(upscaleModes as readonly string[]).includes(value.upscaleMode)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["upscaleMode"],
          message: `${model.name} requires an upscale mode`,
        })
      }

      if (value.upscaleMode === "target") {
        const resolutions = enhanceModelTargetResolutions(model)

        if (
          !value.targetResolution ||
          !(resolutions as readonly string[]).includes(value.targetResolution)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["targetResolution"],
            message: `${model.name} requires a target resolution`,
          })
        }
      }
    } else {
      if (value.upscaleMode != null) {
        ctx.addIssue({
          code: "custom",
          path: ["upscaleMode"],
          message: `${model.name} does not support upscale mode`,
        })
      }

      if (value.targetResolution != null) {
        ctx.addIssue({
          code: "custom",
          path: ["targetResolution"],
          message: `${model.name} does not support target resolution`,
        })
      }
    }

    if (value.noiseScale != null) {
      if (!enhanceModelShowsNoiseScale(model)) {
        ctx.addIssue({
          code: "custom",
          path: ["noiseScale"],
          message: `${model.name} does not support noise scale`,
        })
      } else if (value.noiseScale < 0 || value.noiseScale > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["noiseScale"],
          message: "Noise scale must be between 0 and 1",
        })
      }
    }

    const topazModels = enhanceModelTopazModels(model)

    if (topazModels.length > 0) {
      if (
        !value.topazModel ||
        !(topazModels as readonly string[]).includes(value.topazModel)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["topazModel"],
          message: `${model.name} requires a Topaz model`,
        })
      }
    } else if (value.topazModel != null) {
      ctx.addIssue({
        code: "custom",
        path: ["topazModel"],
        message: `${model.name} does not support Topaz models`,
      })
    }

    if (value.targetFps != null) {
      if (!enhanceModelShowsTargetFps(model)) {
        ctx.addIssue({
          code: "custom",
          path: ["targetFps"],
          message: `${model.name} does not support target FPS`,
        })
      } else if (value.targetFps < 16 || value.targetFps > 60) {
        ctx.addIssue({
          code: "custom",
          path: ["targetFps"],
          message: "Target FPS must be between 16 and 60",
        })
      }
    }
  })

export const createEnhanceSessionRequestSchema = createEnhanceTurnRequestSchema

export const enhanceSessionIdParamsSchema = z.object({
  id: z.string().min(1, "Session id is required"),
})
