import { imageModels } from "@workspace/shared/api/image/models"
import type { ImageGeneration } from "@workspace/shared/api/image/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { GenerationImageGrid } from "@/components/image/generation-image-grid"

type GenerationTurnProps = {
  generation: ImageGeneration
}

export function GenerationTurn({ generation }: GenerationTurnProps) {
  const model = imageModels.find((item) => item.id === generation.model)

  return (
    <MessageScrollerItem messageId={generation.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                {generation.prompt}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="px-1">
              <Badge variant="secondary">
                {model?.name ?? generation.model}
              </Badge>
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <GenerationImageGrid generation={generation} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
