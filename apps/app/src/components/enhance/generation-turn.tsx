import {
  enhanceModels,
  formatEnhanceScale,
} from "@workspace/shared/api/enhance/models"
import type { EnhanceGeneration } from "@workspace/shared/api/enhance/types"
import { Badge } from "@workspace/ui/components/badge"
import { Bubble, BubbleContent } from "@workspace/ui/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@workspace/ui/components/message"
import { MessageScrollerItem } from "@workspace/ui/components/message-scroller"
import { GenerationResult } from "@/components/enhance/generation-result"

type GenerationTurnProps = {
  generation: EnhanceGeneration
}

export function GenerationTurn({ generation }: GenerationTurnProps) {
  const model = enhanceModels.find((item) => item.id === generation.model)
  const label =
    generation.prompt?.trim() ||
    (generation.mediaType === "video" ? "Enhanced video" : "Enhanced image")

  return (
    <MessageScrollerItem messageId={generation.id} scrollAnchor>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Message className="min-w-0 md:w-72 md:shrink-0 lg:w-80">
          <MessageContent>
            <Bubble variant="secondary" className="max-w-full">
              <BubbleContent className="max-w-none">
                <div className="mb-3 overflow-hidden rounded-xl bg-muted">
                  {generation.mediaType === "video" ? (
                    <video
                      src={generation.sourceUrl}
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <img
                      src={generation.sourceUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  )}
                </div>
                {label}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="flex flex-wrap gap-1.5 px-1">
              <Badge variant="secondary">
                {model?.name ?? generation.model}
              </Badge>
              {generation.scale != null ? (
                <Badge variant="secondary">
                  {formatEnhanceScale(generation.scale)}
                </Badge>
              ) : null}
              {generation.topazModel ? (
                <Badge variant="secondary">{generation.topazModel}</Badge>
              ) : null}
              {generation.targetResolution ? (
                <Badge variant="secondary">{generation.targetResolution}</Badge>
              ) : null}
            </MessageFooter>
          </MessageContent>
        </Message>
        <div className="min-w-0 flex-1">
          <GenerationResult generation={generation} />
        </div>
      </div>
    </MessageScrollerItem>
  )
}
