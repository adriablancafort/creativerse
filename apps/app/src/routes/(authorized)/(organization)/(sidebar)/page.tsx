import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(authorized)/(organization)/(sidebar)/")(
  {
    component: Page,
  }
)

function Page() {
  return <div>GenAI Platform</div>
}
