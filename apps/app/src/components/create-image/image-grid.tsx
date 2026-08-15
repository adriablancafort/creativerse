import {
  AiVideoIcon,
  Cancel01Icon,
  Download01Icon,
  MagicWand01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { aspectRatioToCss } from "@workspace/shared/api/create-image/models"
import type { CreateImageTurn } from "@workspace/shared/api/create-image/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useCheckPermission } from "@/lib/auth/permissions"

type CreateImageGridProps = {
  turn: CreateImageTurn
}

type LightboxState = {
  imageId: string
  url: string
  alt: string
  aspect: number
  element: HTMLElement
  origin: DOMRect
}

function gridClassName(count: number) {
  if (count <= 1) {
    return "grid-cols-1"
  }

  if (count === 3) {
    return "grid-cols-2 grid-rows-2"
  }

  return "grid-cols-2"
}

function cellClassName(count: number, index: number) {
  if (count === 3 && index === 0) {
    return "row-span-2 h-full min-h-0"
  }

  return undefined
}

function fitRect(aspect: number, maxWidth: number, maxHeight: number) {
  let width = maxWidth
  let height = width / aspect

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspect
  }

  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  }
}

function downloadImage(url: string, filename: string) {
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

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label="Download image"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        downloadImage(url, filename)
      }}
    >
      <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
      Download
    </Button>
  )
}

function ImageActions({
  url,
  filename,
  className,
}: {
  url: string
  filename: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "absolute top-3 right-3 z-10 flex flex-col items-end gap-2",
        className
      )}
    >
      <EditImageButton url={url} />
      <MakeVideoButton url={url} />
      <EnhanceButton url={url} />
      <DownloadButton url={url} filename={filename} />
    </div>
  )
}

function ImageLightbox({
  state,
  onClose,
}: {
  state: LightboxState
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [origin, setOrigin] = useState(state.origin)
  const closingRef = useRef(false)
  const closedRef = useRef(false)

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      setExpanded(true)
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  function close() {
    if (closingRef.current) {
      return
    }

    closingRef.current = true
    setOrigin(state.element.getBoundingClientRect())
    setExpanded(false)
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const expandedRect = fitRect(
    state.aspect,
    window.innerWidth * 0.92,
    window.innerHeight * 0.92
  )
  const rect = expanded ? expandedRect : origin

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close image"
        className={cn(
          "absolute inset-0 bg-black/70 transition-opacity duration-300",
          expanded ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        aria-label="Close"
        className={cn(
          "absolute top-4 right-4 z-10 transition-opacity duration-300",
          expanded ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </Button>
      <div
        className={cn(
          "group/lightbox fixed overflow-hidden",
          expanded ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: expanded ? 24 : 16,
          transition:
            "top 400ms cubic-bezier(0.32, 0.72, 0, 1), left 400ms cubic-bezier(0.32, 0.72, 0, 1), width 400ms cubic-bezier(0.32, 0.72, 0, 1), height 400ms cubic-bezier(0.32, 0.72, 0, 1), border-radius 400ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "width" && event.propertyName !== "top") {
            return
          }

          if (!expanded && !closedRef.current) {
            closedRef.current = true
            onClose()
          }
        }}
      >
        <img
          src={state.url}
          alt={state.alt}
          className="size-full object-cover shadow-2xl"
        />
        <ImageActions
          url={state.url}
          filename={`${state.alt.slice(0, 40)}.png`}
          className="pointer-events-auto opacity-0 transition-opacity group-hover/lightbox:opacity-100"
        />
      </div>
    </div>,
    document.body
  )
}

export function CreateImageGrid({ turn }: CreateImageGridProps) {
  const aspectRatioCss = aspectRatioToCss(turn.aspectRatio)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const count = turn.images.length
  const [width, height] = turn.aspectRatio.split(":").map(Number)
  const aspect = width && height ? width / height : 1
  const filename = `${turn.prompt.slice(0, 40)}.png`

  return (
    <>
      <div className={cn("grid w-full gap-2", gridClassName(count))}>
        {turn.images.map((image, index) => {
          const isOpen = lightbox?.imageId === image.id

          return (
            <div
              key={image.id}
              className={cn(
                "group/cell relative min-w-0 overflow-hidden rounded-2xl bg-muted",
                cellClassName(count, index)
              )}
              style={
                count === 3 && index === 0
                  ? undefined
                  : { aspectRatio: aspectRatioCss }
              }
            >
              {image.url ? (
                <>
                  <button
                    type="button"
                    className="size-full cursor-zoom-in"
                    aria-label={`View image ${image.index + 1}`}
                    onClick={(event) => {
                      setLightbox({
                        imageId: image.id,
                        url: image.url!,
                        alt: turn.prompt,
                        aspect,
                        element: event.currentTarget,
                        origin: event.currentTarget.getBoundingClientRect(),
                      })
                    }}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className={cn(
                        "size-full object-cover transition-opacity duration-200",
                        isOpen && "opacity-0"
                      )}
                    />
                  </button>
                  <ImageActions
                    url={image.url}
                    filename={filename}
                    className="opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100"
                  />
                </>
              ) : image.status === "failed" ? (
                <div className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  {image.error ?? "Generation failed"}
                </div>
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Spinner className="size-5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {lightbox ? (
        <ImageLightbox state={lightbox} onClose={() => setLightbox(null)} />
      ) : null}
    </>
  )
}
