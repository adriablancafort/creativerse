import { AiMagicIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { enhanceMediaTypes } from "@workspace/shared/api/enhance/models"
import type {
  CreateEnhanceGenerationRequest,
  EnhanceSessionResponse,
} from "@workspace/shared/api/enhance/types"
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
import { EnhanceComposer } from "@/components/enhance/enhance-composer"
import { api } from "@/lib/api"

const enhanceSearchSchema = z.object({
  sourceUrl: z.url().optional(),
  mediaType: z.enum(enhanceMediaTypes).optional(),
})

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/enhance/"
)({
  validateSearch: enhanceSearchSchema,
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
            <BreadcrumbPage>Enhance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function Composer() {
  const { sourceUrl, mediaType } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createSessionMutation = useMutation({
    mutationFn: (values: CreateEnhanceGenerationRequest) =>
      api.post<EnhanceSessionResponse>("/api/enhance/sessions", {
        body: values,
      }),
    onSuccess: (createdSession) => {
      queryClient.invalidateQueries({ queryKey: ["enhance-sessions"] })
      navigate({
        to: "/enhance/$sessionId",
        params: { sessionId: createdSession.id },
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <EnhanceComposer
      key={`${mediaType ?? "image"}:${sourceUrl ?? "new"}`}
      initialSourceUrl={sourceUrl}
      initialMediaType={mediaType}
      isSubmitting={createSessionMutation.isPending}
      onSubmit={(values) => createSessionMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  return (
    <>
      <title>Enhance</title>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Enhance a photo or video</EmptyTitle>
            <EmptyDescription>
              Upscale, sharpen, and restore with creative control
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Composer />
      </div>
    </>
  )
}
