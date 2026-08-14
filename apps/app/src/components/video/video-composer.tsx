import { zodResolver } from "@hookform/resolvers/zod"
import {
  AiMagicIcon,
  Cancel01Icon,
  ImageAdd01Icon,
  Mic01Icon,
  MicOff01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BorderBeam } from "border-beam"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import {
  defaultVideoAspectRatio,
  defaultVideoDuration,
  defaultVideoModelId,
  defaultVideoResolution,
  formatVideoDuration,
  formatVideoResolution,
  getVideoModel,
  type VideoModelId,
  videoAspectRatios,
  videoModelAspectRatios,
  videoModelDurations,
  videoModelResolutions,
  videoModelShowsAspectRatio,
  videoModelSupportsAudio,
  videoModelSupportsEndFrame,
  videoModelSupportsImageToVideo,
  videoModelSupportsTextToVideo,
} from "@workspace/shared/api/video/models"
import { createVideoGenerationRequestSchema } from "@workspace/shared/api/video/schemas"
import type {
  CreateVideoGenerationRequest,
  VideoUploadResponse,
} from "@workspace/shared/api/video/types"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@workspace/ui/components/attachment"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { useTheme } from "@/components/theme-provider"
import { ModelPicker } from "@/components/video/model-picker"
import { api } from "@/lib/api"
import { useCheckPermission } from "@/lib/auth/permissions"

function AspectRatioGlyph({ ratio }: { ratio: string }) {
  const [width, height] = ratio.split(":").map(Number)
  const max = 16
  const scale = max / Math.max(width, height)

  return (
    <span
      aria-hidden="true"
      className="rounded-[3px] border border-current"
      style={{ width: width * scale, height: height * scale }}
    />
  )
}

type VideoComposerProps = {
  pending?: boolean
  isSubmitting: boolean
  initialStartFrameUrl?: string | null
  onSubmit: (values: CreateVideoGenerationRequest) => Promise<unknown>
}

const defaultModel = getVideoModel(defaultVideoModelId)

export function VideoComposer({
  pending = false,
  isSubmitting,
  initialStartFrameUrl = null,
  onSubmit,
}: VideoComposerProps) {
  const { theme } = useTheme()
  const canCreate = useCheckPermission({ video: ["create"] })
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFrame, setUploadingFrame] = useState<"start" | "end" | null>(
    null
  )
  const form = useForm<CreateVideoGenerationRequest>({
    resolver: zodResolver(createVideoGenerationRequestSchema),
    defaultValues: {
      prompt: "",
      model: defaultVideoModelId,
      aspectRatio: defaultVideoAspectRatio,
      duration: defaultVideoDuration(defaultModel),
      resolution: defaultVideoResolution(defaultModel),
      generateAudio: true,
      startFrameUrl: initialStartFrameUrl,
      endFrameUrl: null,
    },
  })
  const prompt = form.watch("prompt")
  const modelId = form.watch("model")
  const startFrameUrl = form.watch("startFrameUrl")
  const endFrameUrl = form.watch("endFrameUrl")
  const generateAudio = form.watch("generateAudio")
  const model = getVideoModel(modelId)
  const aspectRatios = videoModelAspectRatios(model)
  const durations = videoModelDurations(model)
  const resolutions = videoModelResolutions(model)
  const supportsAudio = videoModelSupportsAudio(model)
  const supportsImageToVideo = videoModelSupportsImageToVideo(model)
  const supportsEndFrame = videoModelSupportsEndFrame(model)
  const requiresStartFrame = !videoModelSupportsTextToVideo(model)
  const showAspectRatio = videoModelShowsAspectRatio(
    model,
    Boolean(startFrameUrl)
  )
  const beamTheme = theme === "light" || theme === "dark" ? theme : "auto"
  const isBusy = isSubmitting || pending
  const canSubmit =
    canCreate &&
    !isSubmitting &&
    uploadingFrame === null &&
    prompt.trim().length > 0 &&
    (!requiresStartFrame || Boolean(startFrameUrl))

  function applyModelConstraints(nextModelId: VideoModelId) {
    const nextModel = getVideoModel(nextModelId)
    const nextRatios = videoModelAspectRatios(nextModel)
    const nextDurations = videoModelDurations(nextModel)
    const nextResolutions = videoModelResolutions(nextModel)
    const aspectRatio = form.getValues("aspectRatio")
    const duration = form.getValues("duration")
    const resolution = form.getValues("resolution")

    if (nextRatios.length > 0 && !nextRatios.includes(aspectRatio)) {
      form.setValue("aspectRatio", nextRatios[0] ?? defaultVideoAspectRatio)
    }

    if (!(nextDurations as readonly number[]).includes(duration)) {
      form.setValue("duration", defaultVideoDuration(nextModel))
    }

    if (nextResolutions.length > 0) {
      if (
        !resolution ||
        !(nextResolutions as readonly string[]).includes(resolution)
      ) {
        form.setValue("resolution", defaultVideoResolution(nextModel))
      }
    } else {
      form.setValue("resolution", null)
    }

    if (!videoModelSupportsAudio(nextModel)) {
      form.setValue("generateAudio", false)
    } else if (!form.getValues("generateAudio")) {
      form.setValue("generateAudio", true)
    }

    if (!videoModelSupportsImageToVideo(nextModel)) {
      form.setValue("startFrameUrl", null)
      form.setValue("endFrameUrl", null)
    } else if (!videoModelSupportsEndFrame(nextModel)) {
      form.setValue("endFrameUrl", null)
    }
  }

  async function uploadFrame(kind: "start" | "end", file: File) {
    setUploadingFrame(kind)

    try {
      const body = new FormData()
      body.append("file", file)
      const uploaded = await api.upload<VideoUploadResponse>(
        "/api/video/uploads",
        body
      )
      form.setValue(
        kind === "start" ? "startFrameUrl" : "endFrameUrl",
        uploaded.url
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload frame"
      )
    } finally {
      setUploadingFrame(null)
    }
  }

  async function submit(values: CreateVideoGenerationRequest) {
    await onSubmit(values)
  }

  return (
    <form
      className="pointer-events-auto mx-auto w-full max-w-3xl overflow-visible px-4 pb-5"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <input
        ref={startInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={isSubmitting || !canCreate}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) {
            uploadFrame("start", file)
          }
        }}
      />
      <input
        ref={endInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={isSubmitting || !canCreate}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) {
            uploadFrame("end", file)
          }
        }}
      />
      <BorderBeam
        className="w-full"
        size="pulse-outside"
        colorVariant="colorful"
        theme={beamTheme}
        active={isBusy}
      >
        <InputGroup className="bg-background/60 backdrop-blur-md border border-border/50 has-[[data-slot=input-group-control]:focus-visible]:border-border/50 has-[[data-slot=input-group-control]:focus-visible]:ring-0!">
          {startFrameUrl || endFrameUrl || uploadingFrame ? (
            <InputGroupAddon align="block-start" className="px-4 pt-4 pb-1">
              <AttachmentGroup className="w-full gap-3 py-0">
                {supportsImageToVideo &&
                (startFrameUrl || uploadingFrame === "start") ? (
                  <Attachment
                    orientation="vertical"
                    state={uploadingFrame === "start" ? "uploading" : "done"}
                    className="w-36 has-data-[slot=attachment-content]:w-36"
                  >
                    <AttachmentMedia variant="image">
                      {startFrameUrl ? (
                        <img src={startFrameUrl} alt="" />
                      ) : (
                        <Spinner />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>Start frame</AttachmentTitle>
                    </AttachmentContent>
                    {startFrameUrl ? (
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label="Remove start frame"
                          disabled={isSubmitting || !canCreate}
                          onClick={() => {
                            form.setValue("startFrameUrl", null)
                            form.setValue("endFrameUrl", null)
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                        </AttachmentAction>
                      </AttachmentActions>
                    ) : null}
                  </Attachment>
                ) : null}
                {supportsEndFrame &&
                startFrameUrl &&
                (endFrameUrl || uploadingFrame === "end") ? (
                  <Attachment
                    orientation="vertical"
                    state={uploadingFrame === "end" ? "uploading" : "done"}
                    className="w-36 has-data-[slot=attachment-content]:w-36"
                  >
                    <AttachmentMedia variant="image">
                      {endFrameUrl ? (
                        <img src={endFrameUrl} alt="" />
                      ) : (
                        <Spinner />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>End frame</AttachmentTitle>
                    </AttachmentContent>
                    {endFrameUrl ? (
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label="Remove end frame"
                          disabled={isSubmitting || !canCreate}
                          onClick={() => form.setValue("endFrameUrl", null)}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                        </AttachmentAction>
                      </AttachmentActions>
                    ) : null}
                  </Attachment>
                ) : null}
              </AttachmentGroup>
            </InputGroupAddon>
          ) : null}
          <Controller
            name="prompt"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputGroupTextarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                aria-label="Video prompt"
                placeholder={
                  requiresStartFrame
                    ? "Describe how the start frame should move..."
                    : "Describe the video you want to create..."
                }
                autoComplete="off"
                rows={3}
                className={
                  startFrameUrl || endFrameUrl || uploadingFrame
                    ? "px-4 pt-2"
                    : "px-4 pt-4"
                }
                readOnly={isSubmitting}
                disabled={!canCreate}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault()
                    form.handleSubmit(submit)()
                  }
                }}
              />
            )}
          />
          <InputGroupAddon align="block-end" className="gap-2.5">
            <Controller
              name="model"
              control={form.control}
              render={({ field }) => (
                <ModelPicker
                  value={field.value}
                  onChange={(nextModelId) => {
                    field.onChange(nextModelId)
                    applyModelConstraints(nextModelId)
                  }}
                  disabled={isSubmitting || !canCreate}
                />
              )}
            />
            {showAspectRatio ? (
              <Controller
                name="aspectRatio"
                control={form.control}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={isSubmitting || !canCreate}
                      render={
                        <InputGroupButton
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting || !canCreate}
                        />
                      }
                    >
                      <AspectRatioGlyph ratio={field.value} />
                      {field.value}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="min-w-36"
                    >
                      <DropdownMenuRadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {videoAspectRatios.map((ratio) => (
                          <DropdownMenuRadioItem
                            key={ratio}
                            value={ratio}
                            disabled={!aspectRatios.includes(ratio)}
                          >
                            <AspectRatioGlyph ratio={ratio} />
                            {ratio}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            <Controller
              name="duration"
              control={form.control}
              render={({ field }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isSubmitting || !canCreate}
                    render={
                      <InputGroupButton
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting || !canCreate}
                      />
                    }
                  >
                    {formatVideoDuration(field.value)}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    className="min-w-28 scrollbar-none"
                  >
                    <DropdownMenuRadioGroup
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      {durations.map((duration) => (
                        <DropdownMenuRadioItem
                          key={duration}
                          value={String(duration)}
                        >
                          {formatVideoDuration(duration)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
            {resolutions.length > 0 ? (
              <Controller
                name="resolution"
                control={form.control}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={isSubmitting || !canCreate}
                      render={
                        <InputGroupButton
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting || !canCreate}
                        />
                      }
                    >
                      {field.value
                        ? formatVideoResolution(field.value)
                        : "Quality"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="min-w-28"
                    >
                      <DropdownMenuRadioGroup
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        {resolutions.map((resolution) => (
                          <DropdownMenuRadioItem
                            key={resolution}
                            value={resolution}
                          >
                            {formatVideoResolution(resolution)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {supportsAudio ? (
              <InputGroupButton
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || !canCreate}
                aria-pressed={generateAudio}
                aria-label={generateAudio ? "Audio on" : "Audio off"}
                onClick={() => form.setValue("generateAudio", !generateAudio)}
              >
                <HugeiconsIcon
                  icon={generateAudio ? Mic01Icon : MicOff01Icon}
                  strokeWidth={2}
                />
                {generateAudio ? "Audio" : "Muted"}
              </InputGroupButton>
            ) : null}
            {supportsImageToVideo ? (
              <InputGroupButton
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={isSubmitting || !canCreate || uploadingFrame !== null}
                aria-label={
                  startFrameUrl ? "Replace start frame" : "Add start frame"
                }
                onClick={() => startInputRef.current?.click()}
              >
                {uploadingFrame === "start" ? (
                  <Spinner />
                ) : (
                  <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={2} />
                )}
              </InputGroupButton>
            ) : null}
            {supportsEndFrame && startFrameUrl ? (
              <InputGroupButton
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || !canCreate || uploadingFrame !== null}
                aria-label={endFrameUrl ? "Replace end frame" : "Add end frame"}
                onClick={() => endInputRef.current?.click()}
              >
                {uploadingFrame === "end" ? <Spinner /> : "End"}
              </InputGroupButton>
            ) : null}
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-lg"
              disabled={!canSubmit}
              className="ml-auto"
              aria-label="Generate"
            >
              {isSubmitting ? (
                <Spinner />
              ) : (
                <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </BorderBeam>
    </form>
  )
}
