export const editImageAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const

export type EditImageAspectRatio = (typeof editImageAspectRatios)[number]

export const editImageResolutions = [
  "0.5K",
  "1K",
  "2K",
  "4K",
  "1k",
  "2k",
] as const

export type EditImageResolution = (typeof editImageResolutions)[number]

type EditImageModelConfig = {
  id: string
  name: string
  description: string
  aspectRatios?: readonly EditImageAspectRatio[]
  resolutions?: readonly EditImageResolution[]
  fal: {
    endpoint: string
    size: "preset" | "pixels" | "aspect_ratio"
    imageUrlsField: "image_urls"
    extra?: Record<string, string | number | boolean>
  }
}

const nanoBananaAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const satisfies readonly EditImageAspectRatio[]

const nanoBananaResolutions = [
  "0.5K",
  "1K",
  "2K",
  "4K",
] as const satisfies readonly EditImageResolution[]

const grokAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const satisfies readonly EditImageAspectRatio[]

const grokResolutions = [
  "1k",
  "2k",
] as const satisfies readonly EditImageResolution[]

const seedreamAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const satisfies readonly EditImageAspectRatio[]

const fluxAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
] as const satisfies readonly EditImageAspectRatio[]

const gptAspectRatios = [
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
] as const satisfies readonly EditImageAspectRatio[]

const qwenAspectRatios = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const satisfies readonly EditImageAspectRatio[]

export const editImageModels = [
  {
    id: "seedream-5-pro",
    name: "Seedream 5 Pro",
    description: "ByteDance flagship image editing",
    aspectRatios: seedreamAspectRatios,
    fal: {
      endpoint: "bytedance/seedream/v5/pro/edit",
      size: "pixels",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "seedream-5-lite",
    name: "Seedream 5 Lite",
    description: "Faster Seedream 5 editing",
    aspectRatios: seedreamAspectRatios,
    fal: {
      endpoint: "bytedance/seedream/v5/lite/edit",
      size: "pixels",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "seedream-4-5",
    name: "Seedream 4.5",
    description: "Strong consistency and editing",
    aspectRatios: seedreamAspectRatios,
    fal: {
      endpoint: "fal-ai/bytedance/seedream/v4.5/edit",
      size: "pixels",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "seedream-4",
    name: "Seedream 4.0",
    description: "Lower-cost Seedream editing",
    aspectRatios: seedreamAspectRatios,
    fal: {
      endpoint: "fal-ai/bytedance/seedream/v4/edit",
      size: "pixels",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "nano-banana-2",
    name: "Nano Banana 2",
    description: "Google Gemini Flash image editing",
    aspectRatios: nanoBananaAspectRatios,
    resolutions: nanoBananaResolutions,
    fal: {
      endpoint: "fal-ai/nano-banana-2/edit",
      size: "aspect_ratio",
      imageUrlsField: "image_urls",
      extra: {
        limit_generations: true,
      },
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    description: "Google Gemini Pro image editing",
    aspectRatios: nanoBananaAspectRatios,
    resolutions: nanoBananaResolutions,
    fal: {
      endpoint: "fal-ai/nano-banana-pro/edit",
      size: "aspect_ratio",
      imageUrlsField: "image_urls",
      extra: {
        limit_generations: true,
      },
    },
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    description: "OpenAI image editing",
    aspectRatios: gptAspectRatios,
    fal: {
      endpoint: "openai/gpt-image-2/edit",
      size: "preset",
      imageUrlsField: "image_urls",
      extra: { quality: "high" },
    },
  },
  {
    id: "grok-imagine",
    name: "Grok Imagine",
    description: "xAI image editing",
    aspectRatios: grokAspectRatios,
    resolutions: grokResolutions,
    fal: {
      endpoint: "xai/grok-imagine-image/edit",
      size: "aspect_ratio",
      imageUrlsField: "image_urls",
      extra: {
        output_format: "png",
      },
    },
  },
  {
    id: "flux-2-max",
    name: "FLUX.2 Max",
    description: "Black Forest Labs flagship editing",
    aspectRatios: fluxAspectRatios,
    fal: {
      endpoint: "fal-ai/flux-2-max/edit",
      size: "preset",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "flux-2-pro",
    name: "FLUX.2 Pro",
    description: "Black Forest Labs photoreal editing",
    aspectRatios: fluxAspectRatios,
    fal: {
      endpoint: "fal-ai/flux-2-pro/edit",
      size: "preset",
      imageUrlsField: "image_urls",
    },
  },
  {
    id: "qwen-image-2-pro",
    name: "Qwen Image 2 Pro",
    description: "Multilingual text-heavy editing",
    aspectRatios: qwenAspectRatios,
    fal: {
      endpoint: "fal-ai/qwen-image-2/edit",
      size: "preset",
      imageUrlsField: "image_urls",
    },
  },
] as const satisfies readonly EditImageModelConfig[]

export type EditImageModel = EditImageModelConfig
export type EditImageModelId = (typeof editImageModels)[number]["id"]

export const editImageModelIds = editImageModels.map((model) => model.id) as [
  EditImageModelId,
  ...EditImageModelId[],
]

export const defaultEditImageModelId = "seedream-4-5" satisfies EditImageModelId
export const defaultEditImageAspectRatio = "auto" satisfies EditImageAspectRatio

export function getEditImageModel(id: string): EditImageModel {
  const model = editImageModels.find((item) => item.id === id)

  if (!model) {
    throw new Error(`Unknown edit image model: ${id}`)
  }

  return model as EditImageModel
}

export function editImageModelAspectRatios(
  model: EditImageModel
): readonly EditImageAspectRatio[] {
  return model.aspectRatios ?? editImageAspectRatios
}

export function editImageModelResolutions(
  model: EditImageModel
): readonly EditImageResolution[] {
  return model.resolutions ?? []
}

export function editImageModelDefaultResolution(
  model: EditImageModel
): EditImageResolution | null {
  const resolutions = editImageModelResolutions(model)

  if (resolutions.length === 0) {
    return null
  }

  if ((resolutions as readonly string[]).includes("1K")) {
    return "1K"
  }

  if ((resolutions as readonly string[]).includes("1k")) {
    return "1k"
  }

  return resolutions[0] ?? null
}

export function aspectRatioToCss(ratio: string) {
  if (ratio === "auto") {
    return "1/1"
  }

  return ratio.replace(":", "/")
}

const editImageSessionTitleMaxLength = 72

export function editImageSessionTitleFromPrompt(prompt: string) {
  return prompt
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, editImageSessionTitleMaxLength)
}

export function formatEditImageSessionTitle(title: string) {
  if (title.length < editImageSessionTitleMaxLength) {
    return title
  }

  return `${title}...`
}
