import { imageModels } from "@workspace/shared/api/create-image/models"
import type { CreateImageTurn } from "@workspace/shared/api/create-image/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { CreateImageGrid } from "@/components/create-image/image-grid"

type CreateImageTurnProps = {
  turn: CreateImageTurn
}

export function CreateImageTurn({ turn }: CreateImageTurnProps) {
  const model = imageModels.find((item) => item.id === turn.model)

  return (
    <MessageScrollerItem messageId={turn.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                {turn.prompt}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="px-1">
              <Badge variant="secondary">{model?.name ?? turn.model}</Badge>
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <CreateImageGrid turn={turn} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
