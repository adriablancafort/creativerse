export const videoAspectRatios = [
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const

export type VideoAspectRatio = (typeof videoAspectRatios)[number]

export const videoResolutions = [
  "480p",
  "720p",
  "768p",
  "1080p",
  "2K",
  "4k",
  "4K",
  "480P",
  "768P",
] as const

export type VideoResolution = (typeof videoResolutions)[number]

export const videoModes = ["text-to-video", "image-to-video"] as const

export type VideoMode = (typeof videoModes)[number]

type FalEndpointConfig = {
  endpoint: string
  extra?: Record<string, string | number | boolean>
}

type VideoModelConfig = {
  id: string
  name: string
  description: string
  modes: readonly VideoMode[]
  aspectRatios?: readonly VideoAspectRatio[]
  durations: readonly number[]
  resolutions?: readonly VideoResolution[]
  audio?: boolean
  endFrame?: boolean
  fal: {
    textToVideo?: FalEndpointConfig
    imageToVideo?: FalEndpointConfig
    firstLastFrame?: FalEndpointConfig
    durationFormat: "number" | "string" | "seconds-suffix"
    imageUrlField?: "image_url" | "start_image_url"
    endImageUrlField?: "end_image_url" | "tail_image_url"
    aspectRatioWithImage?: boolean
  }
}

const seedanceAspectRatios = [
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const satisfies readonly VideoAspectRatio[]

const klingAspectRatios = [
  "16:9",
  "9:16",
  "1:1",
] as const satisfies readonly VideoAspectRatio[]

const veoAspectRatios = [
  "16:9",
  "9:16",
] as const satisfies readonly VideoAspectRatio[]

const ltxAspectRatios = [
  "16:9",
  "9:16",
] as const satisfies readonly VideoAspectRatio[]

const fluxAspectRatios = [
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
] as const satisfies readonly VideoAspectRatio[]

export const videoModels = [
  {
    id: "seedance-2-5",
    name: "Seedance 2.5",
    description: "ByteDance 30s clips with native audio",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: seedanceAspectRatios,
    durations: [4, 5, 6, 8, 10, 12, 15, 20, 25, 30],
    resolutions: ["480p", "720p"],
    audio: true,
    endFrame: true,
    fal: {
      textToVideo: { endpoint: "bytedance/seedance-2.5/text-to-video" },
      imageToVideo: { endpoint: "bytedance/seedance-2.5/image-to-video" },
      durationFormat: "string",
      imageUrlField: "image_url",
      endImageUrlField: "end_image_url",
    },
  },
  {
    id: "seedance-2-0",
    name: "Seedance 2.0",
    description: "Cinematic ByteDance video with 4K",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: seedanceAspectRatios,
    durations: [4, 5, 6, 8, 10, 12, 15],
    resolutions: ["480p", "720p", "1080p", "4k"],
    audio: true,
    endFrame: true,
    fal: {
      textToVideo: { endpoint: "bytedance/seedance-2.0/text-to-video" },
      imageToVideo: { endpoint: "bytedance/seedance-2.0/image-to-video" },
      durationFormat: "string",
      imageUrlField: "image_url",
      endImageUrlField: "end_image_url",
    },
  },
  {
    id: "minimax-h3",
    name: "MiniMax H3",
    description: "Frontier MiniMax video up to 4K",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: seedanceAspectRatios,
    durations: [5, 6, 8, 10, 12, 15],
    resolutions: ["480P", "768P", "2K", "4K"],
    endFrame: true,
    fal: {
      textToVideo: { endpoint: "minimax/h3/text-to-video" },
      imageToVideo: { endpoint: "minimax/h3/image-to-video" },
      durationFormat: "number",
      imageUrlField: "image_url",
      endImageUrlField: "end_image_url",
    },
  },
  {
    id: "kling-3-pro",
    name: "Kling 3 Pro",
    description: "Cinematic Kling 3 with native audio",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: klingAspectRatios,
    durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    audio: true,
    fal: {
      textToVideo: { endpoint: "fal-ai/kling-video/v3/pro/text-to-video" },
      imageToVideo: { endpoint: "fal-ai/kling-video/v3/pro/image-to-video" },
      durationFormat: "string",
      imageUrlField: "start_image_url",
    },
  },
  {
    id: "kling-o3-pro",
    name: "Kling O3 Pro",
    description: "Kling O3 with audio and 3–15s clips",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: klingAspectRatios,
    durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    audio: true,
    fal: {
      textToVideo: { endpoint: "fal-ai/kling-video/o3/pro/text-to-video" },
      imageToVideo: { endpoint: "fal-ai/kling-video/o3/pro/image-to-video" },
      durationFormat: "string",
      imageUrlField: "start_image_url",
    },
  },
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    description: "Google Veo with native audio and 4K",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: veoAspectRatios,
    durations: [4, 6, 8],
    resolutions: ["720p", "1080p", "4k"],
    audio: true,
    fal: {
      textToVideo: { endpoint: "fal-ai/veo3.1" },
      imageToVideo: { endpoint: "fal-ai/veo3.1/image-to-video" },
      durationFormat: "seconds-suffix",
      imageUrlField: "image_url",
      aspectRatioWithImage: true,
    },
  },
  {
    id: "flux-3",
    name: "FLUX.3",
    description: "Black Forest Labs frontier video",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: fluxAspectRatios,
    durations: [5, 6, 8, 10, 12, 15, 20],
    resolutions: ["720p", "1080p"],
    audio: true,
    endFrame: true,
    fal: {
      textToVideo: { endpoint: "blackforestlabs/flux-3/text-to-video" },
      imageToVideo: { endpoint: "blackforestlabs/flux-3/image-to-video" },
      firstLastFrame: {
        endpoint: "blackforestlabs/flux-3/first-last-frame-to-video",
      },
      durationFormat: "string",
      imageUrlField: "image_url",
      endImageUrlField: "end_image_url",
      aspectRatioWithImage: true,
    },
  },
  {
    id: "ltx-2-5-pro",
    name: "LTX-2.5 Pro",
    description: "Lightricks audio-video in one pass",
    modes: ["text-to-video", "image-to-video"],
    aspectRatios: ltxAspectRatios,
    durations: [6, 8, 10],
    resolutions: ["720p", "1080p"],
    audio: true,
    endFrame: true,
    fal: {
      textToVideo: { endpoint: "lightricks/ltx-2.5/text-to-video/pro" },
      imageToVideo: { endpoint: "lightricks/ltx-2.5/image-to-video/pro" },
      durationFormat: "string",
      imageUrlField: "image_url",
      endImageUrlField: "end_image_url",
      aspectRatioWithImage: true,
    },
  },
  {
    id: "kling-2-5-turbo",
    name: "Kling 2.5 Turbo",
    description: "Fast Kling image-to-video",
    modes: ["image-to-video"],
    durations: [5, 10],
    endFrame: true,
    fal: {
      imageToVideo: {
        endpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
      },
      durationFormat: "string",
      imageUrlField: "image_url",
      endImageUrlField: "tail_image_url",
    },
  },
] as const satisfies readonly VideoModelConfig[]

export type VideoModel = VideoModelConfig
export type VideoModelId = (typeof videoModels)[number]["id"]

export const videoModelIds = videoModels.map((model) => model.id) as [
  VideoModelId,
  ...VideoModelId[],
]

export const defaultVideoModelId = "seedance-2-5" satisfies VideoModelId
export const defaultVideoAspectRatio = "16:9" satisfies VideoAspectRatio

export function getVideoModel(id: string): VideoModel {
  const model = videoModels.find((item) => item.id === id)

  if (!model) {
    throw new Error(`Unknown video model: ${id}`)
  }

  return model as VideoModel
}

export function videoModelAspectRatios(
  model: VideoModel
): readonly VideoAspectRatio[] {
  return model.aspectRatios ?? []
}

export function videoModelDurations(model: VideoModel): readonly number[] {
  return model.durations
}

export function videoModelResolutions(
  model: VideoModel
): readonly VideoResolution[] {
  return model.resolutions ?? []
}

export function videoModelSupportsAudio(model: VideoModel) {
  return Boolean(model.audio)
}

export function videoModelSupportsEndFrame(model: VideoModel) {
  return Boolean(model.endFrame)
}

export function videoModelSupportsTextToVideo(model: VideoModel) {
  return model.modes.includes("text-to-video")
}

export function videoModelSupportsImageToVideo(model: VideoModel) {
  return model.modes.includes("image-to-video")
}

export function videoModelShowsAspectRatio(
  model: VideoModel,
  hasStartFrame: boolean
) {
  if (videoModelAspectRatios(model).length === 0) {
    return false
  }

  if (!hasStartFrame) {
    return true
  }

  return Boolean(model.fal.aspectRatioWithImage)
}

export function defaultVideoDuration(model: VideoModel) {
  const preferred = [8, 5, 6, 10]
  const durations = model.durations as readonly number[]
  return (
    preferred.find((duration) => durations.includes(duration)) ??
    durations[0] ??
    8
  )
}

export function defaultVideoResolution(
  model: VideoModel
): VideoResolution | null {
  return model.resolutions?.[0] ?? null
}

export function formatFalDuration(
  format: VideoModel["fal"]["durationFormat"],
  seconds: number
) {
  if (format === "number") {
    return seconds
  }

  if (format === "seconds-suffix") {
    return `${seconds}s`
  }

  return String(seconds)
}

export function formatVideoDuration(seconds: number) {
  return `${seconds}s`
}

export function formatVideoResolution(resolution: string) {
  if (resolution === "480P") {
    return "480p"
  }

  if (resolution === "768P") {
    return "768p"
  }

  if (resolution === "4k") {
    return "4K"
  }

  return resolution
}

export function aspectRatioToCss(ratio: string) {
  return ratio.replace(":", "/")
}

const videoSessionTitleMaxLength = 72

export function videoSessionTitleFromPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ").slice(0, videoSessionTitleMaxLength)
}

export function formatVideoSessionTitle(title: string) {
  if (title.length < videoSessionTitleMaxLength) {
    return title
  }

  return `${title}...`
}
