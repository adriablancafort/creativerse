import { AiImageIcon, Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { Link, useMatchRoute } from "@tanstack/react-router"

import { formatImageSessionTitle } from "@workspace/shared/api/image/models"
import type { ImageSessionListResponse } from "@workspace/shared/api/image/types"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { api } from "@/lib/api"

export function NavMain() {
  const matchRoute = useMatchRoute()
  const { data: sessions = [] } = useQuery({
    queryKey: ["image-sessions"],
    queryFn: () => api.get<ImageSessionListResponse>("/api/image/sessions"),
  })

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
        </SidebarMenu>
      </SidebarGroup>
      {sessions.length > 0 ? (
        <SidebarGroup>
          <SidebarGroupLabel>Sessions</SidebarGroupLabel>
          <SidebarMenu>
            {sessions.map((session) => {
              const title = formatImageSessionTitle(session.title)

              return (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    size="sm"
                    tooltip={title}
                    isActive={Boolean(
                      matchRoute({
                        to: "/image/$sessionId",
                        params: { sessionId: session.id },
                      })
                    )}
                    render={
                      <Link
                        to="/image/$sessionId"
                        params={{ sessionId: session.id }}
                      />
                    }
                  >
                    <span>{title}</span>
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
