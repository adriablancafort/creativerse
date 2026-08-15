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
  defaultEditImageAspectRatio,
  defaultEditImageModelId,
  type EditImageModelId,
  editImageAspectRatios,
  editImageModelAspectRatios,
  editImageModelDefaultResolution,
  editImageModelResolutions,
  getEditImageModel,
} from "@workspace/shared/api/edit-image/models"
import { editImageTurnRequestSchema } from "@workspace/shared/api/edit-image/schemas"
import type {
  EditImageTurnRequest,
  EditImageUploadResponse,
} from "@workspace/shared/api/edit-image/types"
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
import { ModelPicker } from "@/components/edit-image/model-picker"
import { useTheme } from "@/components/theme-provider"
import { api } from "@/lib/api"
import { useCheckPermission } from "@/lib/auth/permissions"

function AspectRatioGlyph({ ratio }: { ratio: string }) {
  if (ratio === "auto") {
    return (
      <span
        aria-hidden="true"
        className="flex size-4 items-center justify-center rounded-[3px] border border-current text-[8px] leading-none"
      >
        A
      </span>
    )
  }

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

function defaultEditImageValues(
  sourceUrl: string | null = null
): EditImageTurnRequest {
  const model = getEditImageModel(defaultEditImageModelId)

  return {
    prompt: "",
    model: defaultEditImageModelId,
    aspectRatio: defaultEditImageAspectRatio,
    sourceUrl: sourceUrl ?? "",
    resolution: editImageModelDefaultResolution(model),
  }
}

type EditImageComposerProps = {
  pending?: boolean
  isSubmitting: boolean
  initialSourceUrl?: string | null
  onSubmit: (values: EditImageTurnRequest) => Promise<unknown>
}

export function EditImageComposer({
  pending = false,
  isSubmitting,
  initialSourceUrl = null,
  onSubmit,
}: EditImageComposerProps) {
  const { theme } = useTheme()
  const canCreate = useCheckPermission({ editImage: ["create"] })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const form = useForm<EditImageTurnRequest>({
    resolver: zodResolver(editImageTurnRequestSchema),
    defaultValues: defaultEditImageValues(initialSourceUrl),
  })
  const prompt = form.watch("prompt")
  const modelId = form.watch("model")
  const sourceUrl = form.watch("sourceUrl")
  const model = getEditImageModel(modelId)
  const aspectRatios = editImageModelAspectRatios(model)
  const resolutions = editImageModelResolutions(model)
  const beamTheme = theme === "light" || theme === "dark" ? theme : "auto"
  const isBusy = isSubmitting || pending
  const canSubmit =
    canCreate &&
    !isSubmitting &&
    !uploading &&
    prompt.trim().length > 0 &&
    Boolean(sourceUrl)

  function applyModelConstraints(nextModelId: EditImageModelId) {
    const nextModel = getEditImageModel(nextModelId)
    const nextRatios = editImageModelAspectRatios(nextModel)
    const nextResolutions = editImageModelResolutions(nextModel)
    const aspectRatio = form.getValues("aspectRatio")
    const resolution = form.getValues("resolution")

    if (!nextRatios.includes(aspectRatio)) {
      form.setValue("aspectRatio", nextRatios[0] ?? defaultEditImageAspectRatio)
    }

    if (nextResolutions.length > 0) {
      if (
        !resolution ||
        !(nextResolutions as readonly string[]).includes(resolution)
      ) {
        form.setValue("resolution", editImageModelDefaultResolution(nextModel))
      }
    } else {
      form.setValue("resolution", null)
    }
  }

  async function uploadSource(file: File) {
    setUploading(true)

    try {
      const body = new FormData()
      body.append("file", file)
      const uploaded = await api.upload<EditImageUploadResponse>(
        "/api/edit-image/uploads",
        body
      )
      form.setValue("sourceUrl", uploaded.url)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      )
    } finally {
      setUploading(false)
    }
  }

  async function submit(values: EditImageTurnRequest) {
    await onSubmit(values)
    form.reset(defaultEditImageValues())
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
        accept="image/jpeg,image/png,image/webp"
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
                  <AttachmentMedia variant="image">
                    {sourceUrl ? <img src={sourceUrl} alt="" /> : <Spinner />}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>Source image</AttachmentTitle>
                  </AttachmentContent>
                  {sourceUrl ? (
                    <AttachmentActions>
                      <AttachmentAction
                        type="button"
                        aria-label="Remove source image"
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
          <Controller
            name="prompt"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputGroupTextarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                aria-label="Edit prompt"
                placeholder="Describe how to edit the image..."
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
          <InputGroupAddon
            align="block-end"
            className={sourceUrl || uploading ? "gap-2.5 pt-1" : "gap-2.5"}
          >
            <InputGroupButton
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || !canCreate || uploading}
              aria-label={sourceUrl ? "Replace source image" : "Add image"}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Spinner />
              ) : (
                <>
                  <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={2} />
                  Source
                </>
              )}
            </InputGroupButton>
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
                      {editImageAspectRatios.map((ratio) => (
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
                      {field.value ?? resolutions[0]}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="min-w-28"
                    >
                      <DropdownMenuRadioGroup
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        {resolutions.map((resolution) => (
                          <DropdownMenuRadioItem
                            key={resolution}
                            value={resolution}
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
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              disabled={isSubmitting || !canCreate}
              aria-label="Clear"
              onClick={() => form.reset(defaultEditImageValues())}
            >
              <HugeiconsIcon icon={EraserIcon} strokeWidth={2} />
            </InputGroupButton>
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-lg"
              disabled={!canSubmit}
              aria-label="Edit image"
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
