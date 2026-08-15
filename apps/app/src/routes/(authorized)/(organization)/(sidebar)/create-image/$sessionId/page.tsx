import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { formatImageSessionTitle } from "@workspace/shared/api/create-image/models"
import type {
  CreateImageSessionResponse,
  CreateImageTurn,
  CreateImageTurnRequest,
  CreateImageTurnResponse,
} from "@workspace/shared/api/create-image/types"
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
import { CreateImageComposer } from "@/components/create-image/composer"
import { CreateImageTurn as CreateImageTurnView } from "@/components/create-image/turn"
import { api } from "@/lib/api"

function hasPendingTurns(turns: CreateImageTurn[]) {
  return turns.some((turn) =>
    turn.images.some((image) => image.status === "pending")
  )
}

function createImageSessionQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ["create-image-session", sessionId],
    queryFn: () =>
      api.get<CreateImageSessionResponse>(
        `/api/create-image/sessions/${sessionId}`
      ),
    refetchInterval: (query) => {
      const session = query.state.data

      if (!session || !hasPendingTurns(session.turns)) {
        return false
      }

      return 1000
    },
  })
}

export const Route = createFileRoute(
  "/(authorized)/(organization)/(sidebar)/create-image/$sessionId/"
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
    mutationFn: (values: CreateImageTurnRequest) =>
      api.post<CreateImageTurnResponse>(
        `/api/create-image/sessions/${sessionId}/turns`,
        { body: values }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["create-image-session", sessionId],
      })
      queryClient.invalidateQueries({ queryKey: ["create-image-sessions"] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <CreateImageComposer
      pending={pending}
      isSubmitting={addTurnMutation.isPending}
      onSubmit={(values) => addTurnMutation.mutateAsync(values)}
    />
  )
}

function Page() {
  const { sessionId } = Route.useParams()
  const { data: session } = useSuspenseQuery(
    createImageSessionQueryOptions(sessionId)
  )
  const title = formatImageSessionTitle(session.title)
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
                    <CreateImageTurnView key={turn.id} turn={turn} />
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton className="data-[direction=end]:bottom-40" />
            </MessageScroller>
          </MessageScrollerProvider>
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <Composer key={sessionId} sessionId={sessionId} pending={isBusy} />
          </div>
        </div>
      </div>
    </>
  )
}
