export const enhanceMediaTypes = ["image", "video"] as const

export type EnhanceMediaType = (typeof enhanceMediaTypes)[number]

export const enhanceUpscaleModes = ["factor", "target"] as const

export type EnhanceUpscaleMode = (typeof enhanceUpscaleModes)[number]

export const enhanceTargetResolutions = [
  "720p",
  "1080p",
  "1440p",
  "2160p",
] as const

export type EnhanceTargetResolution = (typeof enhanceTargetResolutions)[number]

export const enhanceTopazModels = [
  "Proteus",
  "Artemis HQ",
  "Artemis MQ",
  "Gaia HQ",
  "Gaia CG",
  "Gaia 2",
  "Starlight Precise 2.5",
  "Starlight HQ",
  "Starlight Fast 2",
] as const

export type EnhanceTopazModel = (typeof enhanceTopazModels)[number]

type EnhanceModelConfig = {
  id: string
  name: string
  description: string
  mediaType: EnhanceMediaType
  prompt?: boolean
  scales?: readonly number[]
  creativities?: boolean
  details?: boolean
  shapePreservations?: boolean
  upscaleModes?: readonly EnhanceUpscaleMode[]
  targetResolutions?: readonly EnhanceTargetResolution[]
  topazModels?: readonly EnhanceTopazModel[]
  targetFps?: boolean
  noiseScale?: boolean
  fal: {
    endpoint: string
    imageUrlField?: "image_url"
    videoUrlField?: "video_url"
    extra?: Record<string, string | number | boolean>
  }
}

const seedvrScales = [2, 4] as const
const creativeScales = [2, 4] as const
const topazScales = [2, 4] as const

export const enhanceModels = [
  {
    id: "creative-upscaler",
    name: "Creative Upscaler",
    description: "Magnific-style creative upscale with prompt control",
    mediaType: "image",
    prompt: true,
    scales: creativeScales,
    creativities: true,
    details: true,
    shapePreservations: true,
    fal: {
      endpoint: "fal-ai/creative-upscaler",
      imageUrlField: "image_url",
      extra: {
        override_size_limits: true,
      },
    },
  },
  {
    id: "seedvr-image",
    name: "SeedVR2 Image",
    description: "High-capacity image upscale by factor or target",
    mediaType: "image",
    scales: seedvrScales,
    upscaleModes: enhanceUpscaleModes,
    targetResolutions: enhanceTargetResolutions,
    noiseScale: true,
    fal: {
      endpoint: "fal-ai/seedvr/upscale/image",
      imageUrlField: "image_url",
    },
  },
  {
    id: "recraft-crisp",
    name: "Recraft Crisp",
    description: "Sharp detail and face refinement",
    mediaType: "image",
    fal: {
      endpoint: "fal-ai/recraft/upscale/crisp",
      imageUrlField: "image_url",
    },
  },
  {
    id: "recraft-creative",
    name: "Recraft Creative",
    description: "Clean creative upscale with stronger rebuild",
    mediaType: "image",
    fal: {
      endpoint: "fal-ai/recraft/upscale/creative",
      imageUrlField: "image_url",
    },
  },
  {
    id: "topaz-video",
    name: "Topaz Video",
    description: "Professional video upscale and restoration",
    mediaType: "video",
    scales: topazScales,
    topazModels: enhanceTopazModels,
    targetFps: true,
    fal: {
      endpoint: "fal-ai/topaz/upscale/video",
      videoUrlField: "video_url",
    },
  },
  {
    id: "seedvr-video",
    name: "SeedVR2 Video",
    description: "Temporal-consistent video upscale",
    mediaType: "video",
    scales: seedvrScales,
    upscaleModes: enhanceUpscaleModes,
    targetResolutions: enhanceTargetResolutions,
    noiseScale: true,
    fal: {
      endpoint: "fal-ai/seedvr/upscale/video",
      videoUrlField: "video_url",
    },
  },
] as const satisfies readonly EnhanceModelConfig[]

export type EnhanceModel = EnhanceModelConfig
export type EnhanceModelId = (typeof enhanceModels)[number]["id"]

export const enhanceModelIds = enhanceModels.map((model) => model.id) as [
  EnhanceModelId,
  ...EnhanceModelId[],
]

export const defaultEnhanceImageModelId =
  "creative-upscaler" satisfies EnhanceModelId
export const defaultEnhanceVideoModelId = "topaz-video" satisfies EnhanceModelId

export function getEnhanceModel(id: string): EnhanceModel {
  const model = enhanceModels.find((item) => item.id === id)

  if (!model) {
    throw new Error(`Unknown enhance model: ${id}`)
  }

  return model as EnhanceModel
}

export function enhanceModelsForMedia(mediaType: EnhanceMediaType) {
  return enhanceModels.filter((model) => model.mediaType === mediaType)
}

export function defaultEnhanceModelId(mediaType: EnhanceMediaType) {
  return mediaType === "video"
    ? defaultEnhanceVideoModelId
    : defaultEnhanceImageModelId
}

export function enhanceModelShowsPrompt(model: EnhanceModel) {
  return Boolean(model.prompt)
}

export function enhanceModelScales(model: EnhanceModel): readonly number[] {
  return model.scales ?? []
}

export function enhanceModelShowsCreativity(model: EnhanceModel) {
  return Boolean(model.creativities)
}

export function enhanceModelShowsDetail(model: EnhanceModel) {
  return Boolean(model.details)
}

export function enhanceModelShowsShapePreservation(model: EnhanceModel) {
  return Boolean(model.shapePreservations)
}

export function enhanceModelUpscaleModes(
  model: EnhanceModel
): readonly EnhanceUpscaleMode[] {
  return model.upscaleModes ?? []
}

export function enhanceModelTargetResolutions(
  model: EnhanceModel
): readonly EnhanceTargetResolution[] {
  return model.targetResolutions ?? []
}

export function enhanceModelTopazModels(
  model: EnhanceModel
): readonly EnhanceTopazModel[] {
  return model.topazModels ?? []
}

export function enhanceModelShowsTargetFps(model: EnhanceModel) {
  return Boolean(model.targetFps)
}

export function enhanceModelShowsNoiseScale(model: EnhanceModel) {
  return Boolean(model.noiseScale)
}

export function defaultEnhanceScale(model: EnhanceModel): number | null {
  return model.scales?.[0] ?? null
}

export function defaultEnhanceUpscaleMode(
  model: EnhanceModel
): EnhanceUpscaleMode | null {
  return model.upscaleModes?.[0] ?? null
}

export function defaultEnhanceTargetResolution(
  model: EnhanceModel
): EnhanceTargetResolution | null {
  return model.targetResolutions?.[0] ?? null
}

export function defaultEnhanceTopazModel(
  model: EnhanceModel
): EnhanceTopazModel | null {
  return model.topazModels?.[0] ?? null
}

export function formatEnhanceScale(scale: number) {
  return `${scale}x`
}

const enhanceSessionTitleMaxLength = 72

export function enhanceSessionTitleFromSource(options: {
  prompt?: string | null
  mediaType: EnhanceMediaType
  sourceUrl: string
}) {
  const prompt = options.prompt?.trim()

  if (prompt) {
    return prompt.replace(/\s+/g, " ").slice(0, enhanceSessionTitleMaxLength)
  }

  try {
    const pathname = new URL(options.sourceUrl).pathname
    const filename = pathname.split("/").pop()

    if (filename) {
      return `Enhance ${decodeURIComponent(filename)}`.slice(
        0,
        enhanceSessionTitleMaxLength
      )
    }
  } catch {
    // ignore invalid urls for title purposes
  }

  return options.mediaType === "video" ? "Enhance video" : "Enhance image"
}

export function formatEnhanceSessionTitle(title: string) {
  if (title.length < enhanceSessionTitleMaxLength) {
    return title
  }

  return `${title}...`
}
