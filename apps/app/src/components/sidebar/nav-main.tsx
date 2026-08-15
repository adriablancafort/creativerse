import {
  AiImageIcon,
  AiMagicIcon,
  AiVideoIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { Link, useMatchRoute, useRouterState } from "@tanstack/react-router"

import { formatEnhanceSessionTitle } from "@workspace/shared/api/enhance/models"
import type { EnhanceSessionListResponse } from "@workspace/shared/api/enhance/types"
import { formatImageSessionTitle } from "@workspace/shared/api/image/models"
import type { ImageSessionListResponse } from "@workspace/shared/api/image/types"
import { formatVideoSessionTitle } from "@workspace/shared/api/video/models"
import type { VideoSessionListResponse } from "@workspace/shared/api/video/types"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { api } from "@/lib/api"

type SessionMode = "image" | "video" | "enhance"

export function NavMain() {
  const matchRoute = useMatchRoute()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const mode: SessionMode = pathname.startsWith("/video")
    ? "video"
    : pathname.startsWith("/enhance")
      ? "enhance"
      : "image"
  const { data: imageSessions = [] } = useQuery({
    queryKey: ["image-sessions"],
    queryFn: () => api.get<ImageSessionListResponse>("/api/image/sessions"),
    enabled: mode === "image",
  })
  const { data: videoSessions = [] } = useQuery({
    queryKey: ["video-sessions"],
    queryFn: () => api.get<VideoSessionListResponse>("/api/video/sessions"),
    enabled: mode === "video",
  })
  const { data: enhanceSessions = [] } = useQuery({
    queryKey: ["enhance-sessions"],
    queryFn: () => api.get<EnhanceSessionListResponse>("/api/enhance/sessions"),
    enabled: mode === "enhance",
  })
  const sessions =
    mode === "video"
      ? videoSessions.map((session) => ({
          id: session.id,
          title: formatVideoSessionTitle(session.title),
          to: "/video/$sessionId" as const,
        }))
      : mode === "enhance"
        ? enhanceSessions.map((session) => ({
            id: session.id,
            title: formatEnhanceSessionTitle(session.title),
            to: "/enhance/$sessionId" as const,
          }))
        : imageSessions.map((session) => ({
            id: session.id,
            title: formatImageSessionTitle(session.title),
            to: "/image/$sessionId" as const,
          }))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Create Image"
              isActive={Boolean(matchRoute({ to: "/image", fuzzy: false }))}
              render={<Link to="/image" />}
            >
              <HugeiconsIcon icon={AiImageIcon} strokeWidth={2} />
              <span>Create Image</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Create Video"
              isActive={Boolean(matchRoute({ to: "/video", fuzzy: false }))}
              render={<Link to="/video" />}
            >
              <HugeiconsIcon icon={AiVideoIcon} strokeWidth={2} />
              <span>Create Video</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Enhance"
              isActive={Boolean(matchRoute({ to: "/enhance", fuzzy: false }))}
              render={<Link to="/enhance" />}
            >
              <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
              <span>Enhance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {sessions.length > 0 ? (
        <SidebarGroup>
          <SidebarGroupLabel>Sessions</SidebarGroupLabel>
          <SidebarMenu>
            {sessions.map((session) => {
              return (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    size="sm"
                    tooltip={session.title}
                    isActive={Boolean(
                      matchRoute({
                        to: session.to,
                        params: { sessionId: session.id },
                      })
                    )}
                    render={
                      <Link
                        to={session.to}
                        params={{ sessionId: session.id }}
                      />
                    }
                  >
                    <span>{session.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ) : null}
      <SidebarGroup className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              isActive={Boolean(matchRoute({ to: "/settings", fuzzy: true }))}
              render={<Link to="/settings" />}
            >
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  )
}
