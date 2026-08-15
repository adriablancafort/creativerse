import { zodResolver } from "@hookform/resolvers/zod"
import {
  AiMagicIcon,
  Cancel01Icon,
  EraserIcon,
  ImageAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BorderBeam } from "border-beam"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import {
  defaultEnhanceModelId,
  defaultEnhanceScale,
  defaultEnhanceTargetResolution,
  defaultEnhanceTopazModel,
  defaultEnhanceUpscaleMode,
  type EnhanceMediaType,
  type EnhanceModelId,
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
  formatEnhanceScale,
  getEnhanceModel,
} from "@workspace/shared/api/enhance/models"
import { createEnhanceTurnRequestSchema } from "@workspace/shared/api/enhance/schemas"
import type {
  CreateEnhanceTurnRequest,
  EnhanceUploadResponse,
} from "@workspace/shared/api/enhance/types"
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
import { ModelPicker } from "@/components/enhance/model-picker"
import { useTheme } from "@/components/theme-provider"
import { api } from "@/lib/api"
import { useCheckPermission } from "@/lib/auth/permissions"

const creativityPresets = [0, 0.25, 0.5, 0.75, 1] as const
const detailPresets = [0, 0.5, 1, 1.5, 2] as const
const shapePresets = [0, 0.25, 0.5, 0.75, 1] as const
const noisePresets = [0, 0.05, 0.1, 0.2, 0.5] as const
const fpsPresets = [24, 30, 60] as const

type EnhanceComposerProps = {
  pending?: boolean
  isSubmitting: boolean
  initialSourceUrl?: string | null
  initialMediaType?: EnhanceMediaType | null
  onSubmit: (values: CreateEnhanceTurnRequest) => Promise<unknown>
}

function defaultValuesForMedia(
  mediaType: EnhanceMediaType,
  sourceUrl: string | null
): CreateEnhanceTurnRequest {
  const modelId = defaultEnhanceModelId(mediaType)
  const model = getEnhanceModel(modelId)

  return {
    mediaType,
    sourceUrl: sourceUrl ?? "",
    model: modelId,
    prompt: null,
    scale: defaultEnhanceScale(model),
    creativity: enhanceModelShowsCreativity(model) ? 0.5 : null,
    detail: enhanceModelShowsDetail(model) ? 1 : null,
    shapePreservation: enhanceModelShowsShapePreservation(model) ? 0.25 : null,
    upscaleMode: defaultEnhanceUpscaleMode(model),
    targetResolution: defaultEnhanceTargetResolution(model),
    noiseScale: enhanceModelShowsNoiseScale(model) ? 0.1 : null,
    topazModel: defaultEnhanceTopazModel(model),
    targetFps: null,
  }
}

function formatFloat(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
}

export function EnhanceComposer({
  pending = false,
  isSubmitting,
  initialSourceUrl = null,
  initialMediaType = null,
  onSubmit,
}: EnhanceComposerProps) {
  const { theme } = useTheme()
  const canCreate = useCheckPermission({ enhance: ["create"] })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const initialMedia = initialMediaType ?? "image"
  const form = useForm<CreateEnhanceTurnRequest>({
    resolver: zodResolver(createEnhanceTurnRequestSchema),
    defaultValues: defaultValuesForMedia(initialMedia, initialSourceUrl),
  })
  const mediaType = form.watch("mediaType")
  const sourceUrl = form.watch("sourceUrl")
  const modelId = form.watch("model")
  const upscaleMode = form.watch("upscaleMode")
  const model = getEnhanceModel(modelId)
  const scales = enhanceModelScales(model)
  const upscaleModes = enhanceModelUpscaleModes(model)
  const targetResolutions = enhanceModelTargetResolutions(model)
  const topazModels = enhanceModelTopazModels(model)
  const showsPrompt = enhanceModelShowsPrompt(model)
  const showsCreativity = enhanceModelShowsCreativity(model)
  const showsDetail = enhanceModelShowsDetail(model)
  const showsShape = enhanceModelShowsShapePreservation(model)
  const showsNoise = enhanceModelShowsNoiseScale(model)
  const showsTargetFps = enhanceModelShowsTargetFps(model)
  const showScale =
    scales.length > 0 && (upscaleModes.length === 0 || upscaleMode === "factor")
  const showTargetResolution =
    upscaleModes.length > 0 && upscaleMode === "target"
  const beamTheme = theme === "light" || theme === "dark" ? theme : "auto"
  const isBusy = isSubmitting || pending
  const canSubmit =
    canCreate &&
    !isSubmitting &&
    !uploading &&
    Boolean(sourceUrl) &&
    (!showsPrompt || true)

  function applyModelConstraints(nextModelId: EnhanceModelId) {
    const nextModel = getEnhanceModel(nextModelId)
    const nextScales = enhanceModelScales(nextModel)
    const nextModes = enhanceModelUpscaleModes(nextModel)
    const nextResolutions = enhanceModelTargetResolutions(nextModel)
    const nextTopaz = enhanceModelTopazModels(nextModel)
    const scale = form.getValues("scale")
    const mode = form.getValues("upscaleMode")
    const resolution = form.getValues("targetResolution")
    const topazModel = form.getValues("topazModel")

    form.setValue("mediaType", nextModel.mediaType)

    if (nextScales.length > 0) {
      if (scale == null || !(nextScales as readonly number[]).includes(scale)) {
        form.setValue("scale", defaultEnhanceScale(nextModel))
      }
    } else {
      form.setValue("scale", null)
    }

    if (nextModes.length > 0) {
      if (!mode || !(nextModes as readonly string[]).includes(mode)) {
        form.setValue("upscaleMode", defaultEnhanceUpscaleMode(nextModel))
      }

      if (
        !resolution ||
        !(nextResolutions as readonly string[]).includes(resolution)
      ) {
        form.setValue(
          "targetResolution",
          defaultEnhanceTargetResolution(nextModel)
        )
      }
    } else {
      form.setValue("upscaleMode", null)
      form.setValue("targetResolution", null)
    }

    if (nextTopaz.length > 0) {
      if (
        !topazModel ||
        !(nextTopaz as readonly string[]).includes(topazModel)
      ) {
        form.setValue("topazModel", defaultEnhanceTopazModel(nextModel))
      }
    } else {
      form.setValue("topazModel", null)
    }

    form.setValue(
      "creativity",
      enhanceModelShowsCreativity(nextModel)
        ? (form.getValues("creativity") ?? 0.5)
        : null
    )
    form.setValue(
      "detail",
      enhanceModelShowsDetail(nextModel)
        ? (form.getValues("detail") ?? 1)
        : null
    )
    form.setValue(
      "shapePreservation",
      enhanceModelShowsShapePreservation(nextModel)
        ? (form.getValues("shapePreservation") ?? 0.25)
        : null
    )
    form.setValue(
      "noiseScale",
      enhanceModelShowsNoiseScale(nextModel)
        ? (form.getValues("noiseScale") ?? 0.1)
        : null
    )

    if (!enhanceModelShowsTargetFps(nextModel)) {
      form.setValue("targetFps", null)
    }

    if (!enhanceModelShowsPrompt(nextModel)) {
      form.setValue("prompt", null)
    }
  }

  function applyMediaType(nextMediaType: EnhanceMediaType) {
    const nextDefaults = defaultValuesForMedia(
      nextMediaType,
      form.getValues("sourceUrl") || null
    )
    form.reset({
      ...nextDefaults,
      sourceUrl: form.getValues("sourceUrl"),
      prompt: enhanceModelShowsPrompt(getEnhanceModel(nextDefaults.model))
        ? form.getValues("prompt")
        : null,
    })
  }

  async function uploadSource(file: File) {
    setUploading(true)

    try {
      const body = new FormData()
      body.append("file", file)
      const uploaded = await api.upload<EnhanceUploadResponse>(
        "/api/enhance/uploads",
        body
      )
      form.setValue("sourceUrl", uploaded.url)
      if (uploaded.mediaType !== form.getValues("mediaType")) {
        applyMediaType(uploaded.mediaType)
        form.setValue("sourceUrl", uploaded.url)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      )
    } finally {
      setUploading(false)
    }
  }

  async function submit(values: CreateEnhanceTurnRequest) {
    await onSubmit({
      ...values,
      prompt: values.prompt?.trim() ? values.prompt.trim() : null,
    })
    form.reset(defaultValuesForMedia("image", null))
  }

  return (
    <form
      className="pointer-events-auto mx-auto w-full max-w-3xl overflow-visible px-4 pb-5"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        className="sr-only"
        disabled={isSubmitting || !canCreate}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) {
            uploadSource(file)
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
          {sourceUrl || uploading ? (
            <InputGroupAddon align="block-start" className="px-4 pt-4 pb-1">
              <AttachmentGroup className="w-full gap-3 py-0">
                <Attachment
                  orientation="vertical"
                  state={uploading ? "uploading" : "done"}
                  className="w-36 has-data-[slot=attachment-content]:w-36"
                >
                  <AttachmentMedia
                    variant="image"
                    className="*:[video]:aspect-square *:[video]:w-full *:[video]:object-cover"
                  >
                    {sourceUrl ? (
                      mediaType === "video" ? (
                        <video src={sourceUrl} muted playsInline />
                      ) : (
                        <img src={sourceUrl} alt="" />
                      )
                    ) : (
                      <Spinner />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>
                      {mediaType === "video" ? "Source video" : "Source image"}
                    </AttachmentTitle>
                  </AttachmentContent>
                  {sourceUrl ? (
                    <AttachmentActions>
                      <AttachmentAction
                        type="button"
                        aria-label="Remove source"
                        disabled={isSubmitting || !canCreate}
                        onClick={() => form.setValue("sourceUrl", "")}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                      </AttachmentAction>
                    </AttachmentActions>
                  ) : null}
                </Attachment>
              </AttachmentGroup>
            </InputGroupAddon>
          ) : null}
          {showsPrompt ? (
            <Controller
              name="prompt"
              control={form.control}
              render={({ field, fieldState }) => (
                <InputGroupTextarea
                  {...field}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(event.target.value || null)
                  }
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  aria-label="Enhance prompt"
                  placeholder="Optional: describe details to enhance..."
                  autoComplete="off"
                  rows={3}
                  className={sourceUrl || uploading ? "px-4 pt-2" : "px-4 pt-4"}
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
          ) : (
            <div
              className={
                sourceUrl || uploading
                  ? "min-h-10 px-4 pt-2"
                  : "min-h-14 px-4 pt-4"
              }
            />
          )}
          <InputGroupAddon align="block-end" className="gap-2.5">
            <InputGroupButton
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || !canCreate || uploading}
              aria-label={sourceUrl ? "Replace source" : "Add source"}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Spinner />
              ) : (
                <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={2} />
              )}
              Source
            </InputGroupButton>
            <Controller
              name="model"
              control={form.control}
              render={({ field }) => (
                <ModelPicker
                  value={field.value}
                  mediaType={mediaType}
                  onChange={(nextModelId) => {
                    field.onChange(nextModelId)
                    applyModelConstraints(nextModelId)
                  }}
                  disabled={isSubmitting || !canCreate}
                />
              )}
            />
            {topazModels.length > 0 ? (
              <Controller
                name="topazModel"
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
                      {field.value ?? "Model"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="min-w-44 max-h-72 scrollbar-none"
                    >
                      <DropdownMenuRadioGroup
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        {topazModels.map((item) => (
                          <DropdownMenuRadioItem key={item} value={item}>
                            {item}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {upscaleModes.length > 0 ? (
              <Controller
                name="upscaleMode"
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
                      {field.value === "target" ? "Target" : "Factor"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value === "factor") {
                            const nextScale = form.getValues("scale")
                            if (
                              nextScale == null ||
                              !(scales as readonly number[]).includes(nextScale)
                            ) {
                              form.setValue("scale", defaultEnhanceScale(model))
                            }
                          }
                        }}
                      >
                        {upscaleModes.map((mode) => (
                          <DropdownMenuRadioItem key={mode} value={mode}>
                            {mode === "target" ? "Target" : "Factor"}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showScale ? (
              <Controller
                name="scale"
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
                      {field.value != null
                        ? formatEnhanceScale(field.value)
                        : "Scale"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {scales.map((scale) => (
                          <DropdownMenuRadioItem
                            key={scale}
                            value={String(scale)}
                          >
                            {formatEnhanceScale(scale)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showTargetResolution ? (
              <Controller
                name="targetResolution"
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
                      {field.value ?? "Resolution"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        {targetResolutions.map((resolution) => (
                          <DropdownMenuRadioItem
                            key={resolution}
                            value={resolution}
                            disabled={
                              !(
                                targetResolutions as readonly string[]
                              ).includes(resolution)
                            }
                          >
                            {resolution}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showsCreativity ? (
              <Controller
                name="creativity"
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
                      Creativity{" "}
                      {field.value != null ? formatFloat(field.value) : ""}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {creativityPresets.map((value) => (
                          <DropdownMenuRadioItem
                            key={value}
                            value={String(value)}
                          >
                            {formatFloat(value)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showsDetail ? (
              <Controller
                name="detail"
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
                      Detail{" "}
                      {field.value != null ? formatFloat(field.value) : ""}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {detailPresets.map((value) => (
                          <DropdownMenuRadioItem
                            key={value}
                            value={String(value)}
                          >
                            {formatFloat(value)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showsShape ? (
              <Controller
                name="shapePreservation"
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
                      Shape{" "}
                      {field.value != null ? formatFloat(field.value) : ""}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {shapePresets.map((value) => (
                          <DropdownMenuRadioItem
                            key={value}
                            value={String(value)}
                          >
                            {formatFloat(value)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showsNoise ? (
              <Controller
                name="noiseScale"
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
                      Noise{" "}
                      {field.value != null ? formatFloat(field.value) : ""}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {noisePresets.map((value) => (
                          <DropdownMenuRadioItem
                            key={value}
                            value={String(value)}
                          >
                            {formatFloat(value)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            {showsTargetFps ? (
              <Controller
                name="targetFps"
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
                      {field.value != null ? `${field.value} fps` : "FPS"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top">
                      <DropdownMenuRadioGroup
                        value={
                          field.value != null ? String(field.value) : "off"
                        }
                        onValueChange={(value) =>
                          field.onChange(value === "off" ? null : Number(value))
                        }
                      >
                        <DropdownMenuRadioItem value="off">
                          Off
                        </DropdownMenuRadioItem>
                        {fpsPresets.map((value) => (
                          <DropdownMenuRadioItem
                            key={value}
                            value={String(value)}
                          >
                            {value} fps
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            ) : null}
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              disabled={isSubmitting || !canCreate}
              aria-label="Clear"
              onClick={() => form.reset(defaultValuesForMedia("image", null))}
            >
              <HugeiconsIcon icon={EraserIcon} strokeWidth={2} />
            </InputGroupButton>
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-lg"
              disabled={!canSubmit}
              aria-label="Enhance"
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
