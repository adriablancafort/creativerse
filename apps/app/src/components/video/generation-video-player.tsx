import { AiMagicIcon, Download01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { createPlayer } from "@videojs/react"
import { MinimalVideoSkin, Video, videoFeatures } from "@videojs/react/video"
import "@videojs/react/video/minimal-skin.css"
import { useState } from "react"

import { aspectRatioToCss } from "@workspace/shared/api/video/models"
import type { VideoGeneration } from "@workspace/shared/api/video/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useCheckPermission } from "@/lib/auth/permissions"

const Player = createPlayer({ features: videoFeatures })

type GenerationVideoPlayerProps = {
  generation: VideoGeneration
}

function downloadVideo(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.target = "_blank"
  link.rel = "noopener"
  link.click()
}

function EnhanceButton({ url }: { url: string }) {
  const canCreate = useCheckPermission({ enhance: ["create"] })

  if (!canCreate) {
    return null
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      render={
        <Link to="/enhance" search={{ sourceUrl: url, mediaType: "video" }} />
      }
    >
      <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
      Enhance
    </Button>
  )
}

export function GenerationVideoPlayer({
  generation,
}: GenerationVideoPlayerProps) {
  const requestedAspectRatio = aspectRatioToCss(generation.aspectRatio)
  const [aspectRatio, setAspectRatio] = useState(requestedAspectRatio)
  const filename = `${generation.prompt.slice(0, 40)}.mp4`
  const videoUrl = generation.url

  return (
    <div
      className="group/cell relative min-w-0 overflow-hidden rounded-2xl bg-muted [&_.media-button--pip]:hidden!"
      style={{ aspectRatio }}
    >
      {videoUrl ? (
        <>
          <Player.Provider>
            <MinimalVideoSkin className="size-full rounded-2xl">
              <Video
                src={videoUrl}
                playsInline
                autoPlay
                muted
                loop
                disablePictureInPicture
                disableRemotePlayback
                onLoadedMetadata={(event) => {
                  const { videoWidth, videoHeight } = event.currentTarget

                  if (videoWidth > 0 && videoHeight > 0) {
                    setAspectRatio(`${videoWidth} / ${videoHeight}`)
                  }
                }}
              />
            </MinimalVideoSkin>
          </Player.Provider>
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100">
            <EnhanceButton url={videoUrl} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Download video"
              onClick={() => downloadVideo(videoUrl, filename)}
            >
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
              Download
            </Button>
          </div>
        </>
      ) : generation.status === "failed" ? (
        <div className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
          {generation.error ?? "Generation failed"}
        </div>
      ) : (
        <div className="flex size-full items-center justify-center">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  )
}
