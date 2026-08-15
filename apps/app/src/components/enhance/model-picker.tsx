import {
  type EnhanceMediaType,
  type EnhanceModelId,
  enhanceModelsForMedia,
  getEnhanceModel,
} from "@workspace/shared/api/enhance/models"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { InputGroupButton } from "@workspace/ui/components/input-group"

type ModelPickerProps = {
  value: EnhanceModelId
  mediaType: EnhanceMediaType
  onChange: (value: EnhanceModelId) => void
  disabled?: boolean
}

export function ModelPicker({
  value,
  mediaType,
  onChange,
  disabled,
}: ModelPickerProps) {
  const selected = getEnhanceModel(value)
  const models = enhanceModelsForMedia(mediaType)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <InputGroupButton
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
          />
        }
      >
        {selected.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="min-w-64 max-h-100 scrollbar-none"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as EnhanceModelId)}
        >
          {models.map((model) => (
            <DropdownMenuRadioItem key={model.id} value={model.id}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
