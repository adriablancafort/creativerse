import {
  formatVideoDuration,
  formatVideoResolution,
  videoModels,
} from "@workspace/shared/api/create-video/models"
import type { CreatedVideo } from "@workspace/shared/api/create-video/types"
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@workspace/ui/components/attachment"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { CreateVideoPlayer } from "@/components/create-video/video-player"

type CreateVideoTurnProps = {
  turn: CreatedVideo
}

export function CreateVideoTurn({ turn }: CreateVideoTurnProps) {
  const model = videoModels.find((item) => item.id === turn.model)
  const hasFrames = Boolean(turn.startFrameUrl || turn.endFrameUrl)

  return (
    <MessageScrollerItem messageId={turn.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                {hasFrames ? (
                  <AttachmentGroup className="mb-3 w-full gap-3 py-0">
                    {turn.startFrameUrl ? (
                      <Attachment
                        orientation="vertical"
                        state="done"
                        className="w-28 has-data-[slot=attachment-content]:w-28"
                      >
                        <AttachmentMedia variant="image">
                          <img src={turn.startFrameUrl} alt="" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>Start frame</AttachmentTitle>
                        </AttachmentContent>
                      </Attachment>
                    ) : null}
                    {turn.endFrameUrl ? (
                      <Attachment
                        orientation="vertical"
                        state="done"
                        className="w-28 has-data-[slot=attachment-content]:w-28"
                      >
                        <AttachmentMedia variant="image">
                          <img src={turn.endFrameUrl} alt="" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>End frame</AttachmentTitle>
                        </AttachmentContent>
                      </Attachment>
                    ) : null}
                  </AttachmentGroup>
                ) : null}
                {turn.prompt}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="flex flex-wrap gap-1.5 px-1">
              <Badge variant="secondary">{model?.name ?? turn.model}</Badge>
              <Badge variant="secondary">{turn.aspectRatio}</Badge>
              <Badge variant="secondary">
                {formatVideoDuration(turn.duration)}
              </Badge>
              {turn.resolution ? (
                <Badge variant="secondary">
                  {formatVideoResolution(turn.resolution)}
                </Badge>
              ) : null}
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <CreateVideoPlayer turn={turn} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
