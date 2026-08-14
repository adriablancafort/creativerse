export const imageAspectRatios = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const

export type ImageAspectRatio = (typeof imageAspectRatios)[number]

export const imageCounts = [1, 2, 3, 4] as const

export type ImageCount = (typeof imageCounts)[number]

type ImageModelConfig = {
  id: string
  name: string
  description: string
  maxCount: ImageCount
  aspectRatios?: readonly ImageAspectRatio[]
  fal: {
    endpoint: string
    size: "preset" | "pixels" | "aspect_ratio"
    extra?: Record<string, string | number | boolean>
  }
}

export const imageModels = [
  {
    id: "seedream-5-pro",
    name: "Seedream 5 Pro",
    description: "ByteDance flagship image model",
    maxCount: 4,
    fal: {
      endpoint: "bytedance/seedream/v5/pro/text-to-image",
      size: "pixels",
    },
  },
  {
    id: "seedream-5-lite",
    name: "Seedream 5 Lite",
    description: "Faster Seedream 5 generation",
    maxCount: 4,
    fal: {
      endpoint: "bytedance/seedream/v5/lite/text-to-image",
      size: "pixels",
    },
  },
  {
    id: "seedream-4-5",
    name: "Seedream 4.5",
    description: "Strong consistency and editing",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/bytedance/seedream/v4.5/text-to-image",
      size: "pixels",
    },
  },
  {
    id: "seedream-4",
    name: "Seedream 4.0",
    description: "Lower-cost Seedream generation",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/bytedance/seedream/v4/text-to-image",
      size: "pixels",
    },
  },
  {
    id: "nano-banana-2",
    name: "Nano Banana 2",
    description: "Google Gemini Flash image",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/nano-banana-2",
      size: "aspect_ratio",
      extra: {
        resolution: "1K",
        limit_generations: true,
      },
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    description: "Google Gemini Pro image",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/nano-banana-pro",
      size: "aspect_ratio",
      extra: {
        resolution: "1K",
        limit_generations: true,
      },
    },
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    description: "OpenAI image model",
    maxCount: 4,
    fal: {
      endpoint: "openai/gpt-image-2",
      size: "preset",
      extra: { quality: "high" },
    },
  },
  {
    id: "grok-imagine",
    name: "Grok Imagine",
    description: "xAI image generation",
    maxCount: 4,
    fal: {
      endpoint: "xai/grok-imagine-image",
      size: "aspect_ratio",
      extra: {
        resolution: "1k",
        output_format: "png",
      },
    },
  },
  {
    id: "flux-2-max",
    name: "FLUX.2 Max",
    description: "Black Forest Labs flagship",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/flux-2-max",
      size: "preset",
    },
  },
  {
    id: "flux-2-pro",
    name: "FLUX.2 Pro",
    description: "Black Forest Labs photorealism",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/flux-2-pro",
      size: "preset",
    },
  },
  {
    id: "flux-schnell",
    name: "FLUX Schnell",
    description: "Fast low-cost Flux generation",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/flux/schnell",
      size: "preset",
    },
  },
  {
    id: "recraft-v4",
    name: "Recraft V4",
    description: "Brand and design assets",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/recraft/v4/pro/text-to-image",
      size: "preset",
    },
  },
  {
    id: "ideogram-v4",
    name: "Ideogram V4",
    description: "Posters, logos, and text",
    maxCount: 4,
    fal: {
      endpoint: "ideogram/v4",
      size: "preset",
    },
  },
  {
    id: "qwen-image-2-pro",
    name: "Qwen Image 2 Pro",
    description: "Multilingual text-heavy images",
    maxCount: 4,
    fal: {
      endpoint: "fal-ai/qwen-image-2/pro/text-to-image",
      size: "preset",
    },
  },
  {
    id: "krea-2",
    name: "Krea 2",
    description: "Art-directed image generation",
    maxCount: 4,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:2", "2:3"],
    fal: {
      endpoint: "krea/v2/large/text-to-image",
      size: "aspect_ratio",
    },
  },
] as const satisfies readonly ImageModelConfig[]

export type ImageModel = ImageModelConfig

export function getImageModel(id: string): ImageModel {
  const model = imageModels.find((item) => item.id === id)

  if (!model) {
    throw new Error(`Unknown image model: ${id}`)
  }

  return model as ImageModel
}
