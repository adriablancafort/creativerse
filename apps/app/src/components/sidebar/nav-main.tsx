import {
  AiEditingIcon,
  AiImageIcon,
  AiVideoIcon,
  MagicWand01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useMatchRoute } from "@tanstack/react-router"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { NavSessions } from "@/components/sidebar/nav-sessions"

const toolRoutes = [
  {
    title: "Create Image",
    to: "/create-image",
    icon: AiImageIcon,
  },
  {
    title: "Edit Image",
    to: "/edit-image",
    icon: AiEditingIcon,
  },
  {
    title: "Create Video",
    to: "/create-video",
    icon: AiVideoIcon,
  },
  {
    title: "Enhance",
    to: "/enhance",
    icon: MagicWand01Icon,
  },
]

export function NavMain() {
  const matchRoute = useMatchRoute()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarGroup>
        <SidebarGroupLabel>Tools</SidebarGroupLabel>
        <SidebarMenu>
          {toolRoutes.map((tool) => (
            <SidebarMenuItem key={tool.to}>
              <SidebarMenuButton
                tooltip={tool.title}
                isActive={Boolean(matchRoute({ to: tool.to, fuzzy: true }))}
                render={<Link to={tool.to} />}
              >
                <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
                <span>{tool.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <NavSessions />
      <SidebarGroup>
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
