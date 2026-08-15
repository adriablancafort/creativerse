import { editImageModels } from "@workspace/shared/api/edit-image/models"
import type { EditedImage } from "@workspace/shared/api/edit-image/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { EditImageResult } from "@/components/edit-image/result"

type EditImageTurnProps = {
  turn: EditedImage
}

export function EditImageTurn({ turn }: EditImageTurnProps) {
  const model = editImageModels.find((item) => item.id === turn.model)

  return (
    <MessageScrollerItem messageId={turn.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                <div className="mb-3 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={turn.sourceUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </div>
                {turn.prompt}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="flex flex-wrap gap-1.5 px-1">
              <Badge variant="secondary">{model?.name ?? turn.model}</Badge>
              <Badge variant="secondary">{turn.aspectRatio}</Badge>
              {turn.resolution ? (
                <Badge variant="secondary">{turn.resolution}</Badge>
              ) : null}
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <EditImageResult turn={turn} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
