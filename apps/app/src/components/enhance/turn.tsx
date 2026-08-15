import {
  enhanceModels,
  formatEnhanceScale,
} from "@workspace/shared/api/enhance/models"
import type { CreatedEnhance } from "@workspace/shared/api/enhance/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { EnhanceResult } from "@/components/enhance/result"

type EnhanceTurnProps = {
  turn: CreatedEnhance
}

export function EnhanceTurn({ turn }: EnhanceTurnProps) {
  const model = enhanceModels.find((item) => item.id === turn.model)
  const prompt = turn.prompt?.trim()
  const label =
    prompt || (turn.mediaType === "video" ? "Enhanced video" : "Enhanced image")

  return (
    <MessageScrollerItem messageId={turn.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                <div className="mb-3 overflow-hidden rounded-xl bg-muted">
                  {turn.mediaType === "video" ? (
                    <video
                      src={turn.sourceUrl}
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={turn.sourceUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  )}
                </div>
                {label}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="flex flex-wrap gap-1.5 px-1">
              <Badge variant="secondary">{model?.name ?? turn.model}</Badge>
              {turn.scale != null ? (
                <Badge variant="secondary">
                  {formatEnhanceScale(turn.scale)}
                </Badge>
              ) : null}
              {turn.targetResolution ? (
                <Badge variant="secondary">{turn.targetResolution}</Badge>
              ) : null}
              {turn.topazModel ? (
                <Badge variant="secondary">{turn.topazModel}</Badge>
              ) : null}
              {turn.targetFps != null ? (
                <Badge variant="secondary">{turn.targetFps} fps</Badge>
              ) : null}
              {turn.creativity != null ? (
                <Badge variant="secondary">Creativity {turn.creativity}</Badge>
              ) : null}
              {turn.detail != null ? (
                <Badge variant="secondary">Detail {turn.detail}</Badge>
              ) : null}
              {turn.shapePreservation != null ? (
                <Badge variant="secondary">
                  Shape {turn.shapePreservation}
                </Badge>
              ) : null}
              {turn.noiseScale != null ? (
                <Badge variant="secondary">Noise {turn.noiseScale}</Badge>
              ) : null}
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <EnhanceResult turn={turn} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
