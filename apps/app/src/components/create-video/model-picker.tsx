import {
  getVideoModel,
  type VideoModelId,
  videoModels,
} from "@workspace/shared/api/create-video/models"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { InputGroupButton } from "@workspace/ui/components/input-group"

type ModelPickerProps = {
  value: VideoModelId
  onChange: (value: VideoModelId) => void
  disabled?: boolean
}

export function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const selected = getVideoModel(value)

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
          onValueChange={(nextValue) => onChange(nextValue as VideoModelId)}
        >
          {videoModels.map((model) => (
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
