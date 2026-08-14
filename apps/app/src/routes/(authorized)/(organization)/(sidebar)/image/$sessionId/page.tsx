import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { formatImageSessionTitle } from "@workspace/shared/api/image/models"
import type {
  CreateImageGenerationRequest,
  ImageGeneration,
  ImageGenerationResponse,
  ImageSessionResponse,
} from "@workspace/shared/api/image/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/message-scroller"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { toast } from "@workspace/ui/components/sonner"
import { GenerationTurn } from "@/components/image/generation-turn"
import { ImageComposer } from "@/components/image/image-composer"
import { api } from "@/lib/api"

function hasPendingGenerations(generations: ImageGeneration[]) {
  return generations.some((generation) =>
    generation.images.some((image) => image.status === "pending")
  )
}

function imageSessionQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ["image-session", sessionId],
    queryFn: () =>
      api.get<ImageSessionResponse>(`/api/image/sessions/${sessionId}`),
    refetchInterval: (query) => {
      const session = query.state.data

      if (!session || !hasPendingGenerations(session.generations)) {
        return false
      }

      return 1000
    },
  })
}

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/image/$sessionId/"
)({
  component: Page,
})

function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center gap-2 px-5 pt-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
      />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function Composer({
  sessionId,
  pending,
}: {
  sessionId: string
  pending: boolean
}) {
  const queryClient = useQueryClient()
  const addGenerationMutation = useMutation({
    mutationFn: (values: CreateImageGenerationRequest) =>
      api.post<ImageGenerationResponse>(
        `/api/image/sessions/${sessionId}/generations`,
        { body: values }
      ),
    onSuccess: (generation) => {
      queryClient.setQueryData<ImageSessionResponse>(
        ["image-session", sessionId],
        (current) =>
          current
            ? {
                ...current,
                updatedAt: generation.createdAt,
                generations: [...current.generations, generation],
              }
            : current
      )
      queryClient.invalidateQueries({ queryKey: ["image-sessions"] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <ImageComposer
      pending={pending}
      isSubmitting={addGenerationMutation.isPending}
      onSubmit={(values) => addGenerationMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  const { sessionId } = Route.useParams()
  const { data: session } = useSuspenseQuery(
    imageSessionQueryOptions(sessionId)
  )
  const title = formatImageSessionTitle(session.title)
  const isBusy = hasPendingGenerations(session.generations)

  return (
    <>
      <title>{title}</title>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header title={title} />
        <div className="relative min-h-0 flex-1">
          <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="last-anchor"
          >
            <MessageScroller className="absolute inset-0">
              <MessageScrollerViewport>
                <MessageScrollerContent
                  aria-busy={isBusy}
                  className="mx-auto w-full max-w-7xl px-6 pt-6 pb-44"
                >
                  {session.generations.map((generation) => (
                    <GenerationTurn
                      key={generation.id}
                      generation={generation}
                    />
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton className="data-[direction=end]:bottom-40" />
            </MessageScroller>
          </MessageScrollerProvider>
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <Composer sessionId={sessionId} pending={isBusy} />
          </div>
        </div>
      </div>
    </>
  )
}
