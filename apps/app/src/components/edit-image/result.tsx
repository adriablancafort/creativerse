import {
  AiVideoIcon,
  Download01Icon,
  MagicWand01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { aspectRatioToCss } from "@workspace/shared/api/edit-image/models"
import type { EditedImage } from "@workspace/shared/api/edit-image/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useCheckPermission } from "@/lib/auth/permissions"

type EditImageResultProps = {
  turn: EditedImage
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.target = "_blank"
  link.rel = "noopener"
  link.click()
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

function EnhanceButton({ url }: { url: string }) {
  const canCreate = useCheckPermission({ enhance: ["create"] })

  if (!canCreate) {
    return null
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      render={
        <Link to="/enhance" search={{ sourceUrl: url, mediaType: "image" }} />
      }
    >
      <HugeiconsIcon icon={MagicWand01Icon} strokeWidth={2} />
      Enhance
    </Button>
  )
}

function EditAgainButton({ url }: { url: string }) {
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

export function EditImageResult({ turn }: EditImageResultProps) {
  const mediaUrl = turn.url
  const filename = `${turn.prompt.slice(0, 40) || turn.id}.png`
  const [aspectRatio, setAspectRatio] = useState(
    aspectRatioToCss(turn.aspectRatio)
  )

  return (
    <div
      className="group/cell relative min-w-0 overflow-hidden rounded-2xl bg-muted"
      style={{ aspectRatio }}
    >
      {mediaUrl ? (
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
            <EditAgainButton url={mediaUrl} />
            <EnhanceButton url={mediaUrl} />
            <MakeVideoButton url={mediaUrl} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Download image"
              onClick={() => downloadImage(mediaUrl, filename)}
            >
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
              Download
            </Button>
          </div>
        </>
      ) : turn.status === "failed" ? (
        <div className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
          {turn.error ?? "Edit failed"}
        </div>
      ) : (
        <div className="flex size-full items-center justify-center">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  )
}
