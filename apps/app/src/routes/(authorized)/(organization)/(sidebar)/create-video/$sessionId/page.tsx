import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { formatVideoSessionTitle } from "@workspace/shared/api/create-video/models"
import type {
  CreatedVideo,
  CreatedVideoResponse,
  CreateVideoSessionResponse,
  CreateVideoTurnRequest,
} from "@workspace/shared/api/create-video/types"
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
import { CreateVideoComposer } from "@/components/create-video/composer"
import { CreateVideoTurn } from "@/components/create-video/turn"
import { api } from "@/lib/api"

function hasPendingTurns(turns: CreatedVideo[]) {
  return turns.some((turn) => turn.status === "pending")
}

function createVideoSessionQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ["create-video-session", sessionId],
    queryFn: () =>
      api.get<CreateVideoSessionResponse>(
        `/api/create-video/sessions/${sessionId}`
      ),
    refetchInterval: (query) => {
      const session = query.state.data

      if (!session || !hasPendingTurns(session.turns)) {
        return false
      }

      return 2000
    },
  })
}

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/create-video/$sessionId/"
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
  const addTurnMutation = useMutation({
    mutationFn: (values: CreateVideoTurnRequest) =>
      api.post<CreatedVideoResponse>(
        `/api/create-video/sessions/${sessionId}/turns`,
        { body: values }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["create-video-session", sessionId],
      })
      queryClient.invalidateQueries({ queryKey: ["create-video-sessions"] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <CreateVideoComposer
      pending={pending}
      isSubmitting={addTurnMutation.isPending}
      onSubmit={(values) => addTurnMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  const { sessionId } = Route.useParams()
  const { data: session } = useSuspenseQuery(
    createVideoSessionQueryOptions(sessionId)
  )
  const title = formatVideoSessionTitle(session.title)
  const isBusy = hasPendingTurns(session.turns)

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
                  {session.turns.map((turn) => (
                    <CreateVideoTurn key={turn.id} turn={turn} />
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
