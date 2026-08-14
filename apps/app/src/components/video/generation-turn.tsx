import {
  formatVideoDuration,
  videoModels,
} from "@workspace/shared/api/video/models"
import type { VideoGeneration } from "@workspace/shared/api/video/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { GenerationVideoPlayer } from "@/components/video/generation-video-player"

type GenerationTurnProps = {
  generation: VideoGeneration
}

export function GenerationTurn({ generation }: GenerationTurnProps) {
  const model = videoModels.find((item) => item.id === generation.model)

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
            <MessageFooter className="flex flex-wrap gap-1.5 px-1">
              <Badge variant="secondary">
                {model?.name ?? generation.model}
              </Badge>
              <Badge variant="secondary">
                {formatVideoDuration(generation.duration)}
              </Badge>
              {generation.generateAudio ? (
                <Badge variant="secondary">Audio</Badge>
              ) : null}
              <Badge variant="secondary">{generation.aspectRatio}</Badge>
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <GenerationVideoPlayer generation={generation} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
