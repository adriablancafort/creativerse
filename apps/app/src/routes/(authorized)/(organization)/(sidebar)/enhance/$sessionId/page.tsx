import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { formatEnhanceSessionTitle } from "@workspace/shared/api/enhance/models"
import type {
  CreateEnhanceGenerationRequest,
  EnhanceGeneration,
  EnhanceGenerationResponse,
  EnhanceSessionResponse,
} from "@workspace/shared/api/enhance/types"
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
import { EnhanceComposer } from "@/components/enhance/enhance-composer"
import { GenerationTurn } from "@/components/enhance/generation-turn"
import { api } from "@/lib/api"

function hasPendingGenerations(generations: EnhanceGeneration[]) {
  return generations.some((generation) => generation.status === "pending")
}

function enhanceSessionQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ["enhance-session", sessionId],
    queryFn: () =>
      api.get<EnhanceSessionResponse>(`/api/enhance/sessions/${sessionId}`),
    refetchInterval: (query) => {
      const session = query.state.data

      if (!session || !hasPendingGenerations(session.generations)) {
        return false
      }

      return 2000
    },
  })
}

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/enhance/$sessionId/"
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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
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
    mutationFn: (values: CreateEnhanceGenerationRequest) =>
      api.post<EnhanceGenerationResponse>(
        `/api/enhance/sessions/${sessionId}/generations`,
        { body: values }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["enhance-session", sessionId],
      })
      queryClient.invalidateQueries({ queryKey: ["enhance-sessions"] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <EnhanceComposer
      pending={pending}
      isSubmitting={addGenerationMutation.isPending}
      onSubmit={(values) => addGenerationMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  const { sessionId } = Route.useParams()
  const { data: session } = useSuspenseQuery(
    enhanceSessionQueryOptions(sessionId)
  )
  const title = formatEnhanceSessionTitle(session.title)
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
