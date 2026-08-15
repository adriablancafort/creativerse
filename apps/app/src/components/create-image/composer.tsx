import { zodResolver } from "@hookform/resolvers/zod"
import { AiMagicIcon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BorderBeam } from "border-beam"
import { Controller, useForm } from "react-hook-form"

import {
  defaultImageAspectRatio,
  defaultImageModelId,
  getImageModel,
  type ImageModelId,
  imageAspectRatios,
  imageCounts,
  imageModelAspectRatios,
  imageModelCounts,
} from "@workspace/shared/api/create-image/models"
import { createImageTurnRequestSchema } from "@workspace/shared/api/create-image/schemas"
import type { CreateImageTurnRequest } from "@workspace/shared/api/create-image/types"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { ModelPicker } from "@/components/create-image/model-picker"
import { useTheme } from "@/components/theme-provider"
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

type CreateImageComposerProps = {
  pending?: boolean
  isSubmitting: boolean
  onSubmit: (values: CreateImageTurnRequest) => Promise<unknown>
}

export function CreateImageComposer({
  pending = false,
  isSubmitting,
  onSubmit,
}: CreateImageComposerProps) {
  const { theme } = useTheme()
  const canCreate = useCheckPermission({ createImage: ["create"] })
  const form = useForm<CreateImageTurnRequest>({
    resolver: zodResolver(createImageTurnRequestSchema),
    defaultValues: {
      prompt: "",
      model: defaultImageModelId,
      aspectRatio: defaultImageAspectRatio,
      count: 1,
    },
  })
  const prompt = form.watch("prompt")
  const modelId = form.watch("model")
  const model = getImageModel(modelId)
  const aspectRatios = imageModelAspectRatios(model)
  const counts = imageModelCounts(model)
  const beamTheme = theme === "light" || theme === "dark" ? theme : "auto"
  const isBusy = isSubmitting || pending
  const canSubmit = canCreate && !isSubmitting && prompt.trim().length > 0

  function applyModelConstraints(nextModelId: ImageModelId) {
    const nextModel = getImageModel(nextModelId)
    const nextRatios = imageModelAspectRatios(nextModel)
    const aspectRatio = form.getValues("aspectRatio")
    const count = form.getValues("count")

    if (!nextRatios.includes(aspectRatio)) {
      form.setValue("aspectRatio", nextRatios[0] ?? defaultImageAspectRatio)
    }

    if (count > nextModel.maxCount) {
      form.setValue("count", nextModel.maxCount)
    }
  }

  async function submit(values: CreateImageTurnRequest) {
    await onSubmit(values)
  }

  return (
    <form
      className="pointer-events-auto mx-auto w-full max-w-3xl overflow-visible px-4 pb-5"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <BorderBeam
        className="w-full"
        size="pulse-outside"
        colorVariant="colorful"
        theme={beamTheme}
        active={isBusy}
      >
        <InputGroup className="bg-background/60 backdrop-blur-md border border-border/50 has-[[data-slot=input-group-control]:focus-visible]:border-border/50 has-[[data-slot=input-group-control]:focus-visible]:ring-0!">
          <Controller
            name="prompt"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputGroupTextarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                aria-label="Image prompt"
                placeholder="Describe the image you want to create..."
                autoComplete="off"
                rows={3}
                className="px-4 pt-4"
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
                      {imageAspectRatios.map((ratio) => (
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
            <Controller
              name="count"
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
                    <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                    {field.value}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    className="min-w-32"
                  >
                    <DropdownMenuRadioGroup
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      {imageCounts.map((count) => (
                        <DropdownMenuRadioItem
                          key={count}
                          value={String(count)}
                          disabled={!counts.includes(count)}
                        >
                          {count} {count === 1 ? "image" : "images"}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-lg"
              disabled={!canSubmit}
              className="ml-auto"
              aria-label="Create image"
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
