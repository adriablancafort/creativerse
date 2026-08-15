import {
  AiVideoIcon,
  Download01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { createPlayer } from "@videojs/react"
import { MinimalVideoSkin, Video, videoFeatures } from "@videojs/react/video"
import "@videojs/react/video/minimal-skin.css"
import { useState } from "react"

import type { CreatedEnhance } from "@workspace/shared/api/enhance/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useCheckPermission } from "@/lib/auth/permissions"

const Player = createPlayer({ features: videoFeatures })

type EnhanceResultProps = {
  turn: CreatedEnhance
}

function downloadMedia(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.target = "_blank"
  link.rel = "noopener"
  link.click()
}

function EditImageButton({ url }: { url: string }) {
  const canCreate = useCheckPermission({ editImage: ["create"] })

  if (!canCreate) {
    return null
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      render={<Link to="/edit-image" search={{ sourceUrl: url }} />}
    >
      <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} />
      Edit image
    </Button>
  )
}

function MakeVideoButton({ url }: { url: string }) {
  const canCreate = useCheckPermission({ createVideo: ["create"] })

  if (!canCreate) {
    return null
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      render={<Link to="/create-video" search={{ startFrameUrl: url }} />}
    >
      <HugeiconsIcon icon={AiVideoIcon} strokeWidth={2} />
      Create video
    </Button>
  )
}

export function EnhanceResult({ turn }: EnhanceResultProps) {
  const isVideo = turn.mediaType === "video"
  const mediaUrl = turn.url
  const filename = isVideo
    ? `enhanced-${turn.id}.mp4`
    : `enhanced-${turn.id}.png`
  const [aspectRatio, setAspectRatio] = useState(isVideo ? "16 / 9" : "1 / 1")

  return (
    <div
      className="group/cell relative min-w-0 overflow-hidden rounded-2xl bg-muted [&_.media-button--pip]:hidden!"
      style={{ aspectRatio }}
    >
      {mediaUrl ? (
        isVideo ? (
          <>
            <Player.Provider>
              <MinimalVideoSkin className="size-full rounded-2xl">
                <Video
                  src={mediaUrl}
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Download video"
              className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover/cell:opacity-100 focus-visible:opacity-100"
              onClick={() => downloadMedia(mediaUrl, filename)}
            >
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
              Download
            </Button>
          </>
        ) : (
          <>
            <img
              src={mediaUrl}
              alt=""
              className="size-full object-contain"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget

                if (naturalWidth > 0 && naturalHeight > 0) {
                  setAspectRatio(`${naturalWidth} / ${naturalHeight}`)
                }
              }}
            />
            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100">
              <EditImageButton url={mediaUrl} />
              <MakeVideoButton url={mediaUrl} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label="Download image"
                onClick={() => downloadMedia(mediaUrl, filename)}
              >
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                Download
              </Button>
            </div>
          </>
        )
      ) : turn.status === "failed" ? (
        <div className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
          {turn.error ?? "Enhancement failed"}
        </div>
      ) : (
        <div className="flex size-full items-center justify-center">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  )
}
