import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Suspense } from "react"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

export const Route = createFileRoute("/(authorized)/(organization)/(sidebar)")({
  component: Layout,
})

function PageContentSkeleton() {
  return (
    <>
      <header className="flex h-18 items-center gap-3 px-5">
        <Skeleton className="size-6" />
        <Skeleton className="h-4 w-20" />
      </header>
      <div className="p-5 pt-0">
        <Skeleton className="h-120 w-full" />
      </div>
    </>
  )
}

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={<PageContentSkeleton />}>
          <Outlet />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
