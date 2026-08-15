import { AiEditingIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import type {
  EditImageSessionResponse,
  EditImageTurnRequest,
} from "@workspace/shared/api/edit-image/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { toast } from "@workspace/ui/components/sonner"
import { EditImageComposer } from "@/components/edit-image/composer"
import { api } from "@/lib/api"

const editImageSearchSchema = z.object({
  sourceUrl: z.url().optional(),
})

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/edit-image/"
)({
  validateSearch: editImageSearchSchema,
  component: Page,
})

function Header() {
  return (
    <header className="flex h-18 items-center gap-2 px-5">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Image</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function Composer() {
  const { sourceUrl } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createSessionMutation = useMutation({
    mutationFn: (values: EditImageTurnRequest) =>
      api.post<EditImageSessionResponse>("/api/edit-image/sessions", {
        body: values,
      }),
    onSuccess: (createdSession) => {
      queryClient.invalidateQueries({ queryKey: ["edit-image-sessions"] })
      navigate({
        to: "/edit-image/$sessionId",
        params: { sessionId: createdSession.id },
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <EditImageComposer
      initialSourceUrl={sourceUrl}
      isSubmitting={createSessionMutation.isPending}
      onSubmit={(values) => createSessionMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  return (
    <>
      <title>Edit Image</title>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={AiEditingIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Edit an image</EmptyTitle>
            <EmptyDescription>
              Upload an image and describe the changes
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Composer />
      </div>
    </>
  )
}
