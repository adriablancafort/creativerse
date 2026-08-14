import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import type {
  CreateImageGenerationRequest,
  ImageSessionListResponse,
  ImageSessionResponse,
} from "@workspace/shared/api/image/types"
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
import { ImageComposer } from "@/components/image/image-composer"
import { api } from "@/lib/api"

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/image/"
)({
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
            <BreadcrumbPage>Create Image</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function Composer() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createSessionMutation = useMutation({
    mutationFn: (values: CreateImageGenerationRequest) =>
      api.post<ImageSessionResponse>("/api/image/sessions", {
        body: values,
      }),
    onSuccess: (createdSession) => {
      queryClient.setQueryData(
        ["image-session", createdSession.id],
        createdSession
      )
      queryClient.setQueryData<ImageSessionListResponse>(
        ["image-sessions"],
        (current) => [
          createdSession,
          ...(current ?? []).filter(
            (session) => session.id !== createdSession.id
          ),
        ]
      )
      navigate({
        to: "/image/$sessionId",
        params: { sessionId: createdSession.id },
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <ImageComposer
      isSubmitting={createSessionMutation.isPending}
      onSubmit={(values) => createSessionMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  return (
    <>
      <title>Create Image</title>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Create a new image</EmptyTitle>
            <EmptyDescription>
              Describe a subject, mood, or style
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Composer />
      </div>
    </>
  )
}
