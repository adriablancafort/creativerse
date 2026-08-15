import { useQuery } from "@tanstack/react-query"
import { Link, useMatchRoute, useRouterState } from "@tanstack/react-router"

import { formatImageSessionTitle } from "@workspace/shared/api/create-image/models"
import { formatVideoSessionTitle } from "@workspace/shared/api/create-video/models"
import { formatEditImageSessionTitle } from "@workspace/shared/api/edit-image/models"
import { formatEnhanceSessionTitle } from "@workspace/shared/api/enhance/models"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { api } from "@/lib/api"

type SessionListItem = {
  id: string
  title: string
}

type SessionToolConfig = {
  match: (pathname: string) => boolean
  queryKey: readonly string[]
  endpoint: string
  formatTitle: (title: string) => string
  to:
    | "/create-image/$sessionId"
    | "/edit-image/$sessionId"
    | "/create-video/$sessionId"
    | "/enhance/$sessionId"
}

const SESSION_TOOLS: SessionToolConfig[] = [
  {
    match: (pathname) => pathname.startsWith("/create-video"),
    queryKey: ["create-video-sessions"],
    endpoint: "/api/create-video/sessions",
    formatTitle: formatVideoSessionTitle,
    to: "/create-video/$sessionId",
  },
  {
    match: (pathname) => pathname.startsWith("/enhance"),
    queryKey: ["enhance-sessions"],
    endpoint: "/api/enhance/sessions",
    formatTitle: formatEnhanceSessionTitle,
    to: "/enhance/$sessionId",
  },
  {
    match: (pathname) => pathname.startsWith("/edit-image"),
    queryKey: ["edit-image-sessions"],
    endpoint: "/api/edit-image/sessions",
    formatTitle: formatEditImageSessionTitle,
    to: "/edit-image/$sessionId",
  },
  {
    match: (pathname) => pathname.startsWith("/create-image"),
    queryKey: ["create-image-sessions"],
    endpoint: "/api/create-image/sessions",
    formatTitle: formatImageSessionTitle,
    to: "/create-image/$sessionId",
  },
]

export function NavSessions() {
  const matchRoute = useMatchRoute()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const activeTool = SESSION_TOOLS.find((tool) => tool.match(pathname))

  const { data = [] } = useQuery({
    queryKey: activeTool?.queryKey ?? ["sessions-none"],
    queryFn: () => api.get<SessionListItem[]>(activeTool!.endpoint),
    enabled: Boolean(activeTool),
  })

  const sessions = activeTool
    ? data.map((session) => ({
        id: session.id,
        title: activeTool.formatTitle(session.title),
        to: activeTool.to,
      }))
    : []

  if (!activeTool || sessions.length === 0) {
    return <div className="min-h-0 flex-1" aria-hidden />
  }

  return (
    <SidebarGroup className="flex min-h-0 flex-1 flex-col">
      <SidebarGroupLabel>Sessions</SidebarGroupLabel>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-fade-y">
        <SidebarMenu>
          {sessions.map((session) => (
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
                  <Link to={session.to} params={{ sessionId: session.id }} />
                }
              >
                <span>{session.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}
