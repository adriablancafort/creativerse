import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { auth } from "@/lib/auth/config"
import { env } from "@/lib/env"
import { imageRoutes } from "@/routes/image"

const api = new Hono()

api.use(
  "*",
  cors({
    origin: [env.FRONTEND_URL],
    credentials: true,
  })
)

if (env.NODE_ENV !== "production") {
  api.use(logger())
}

api.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

api.route("/api/image", imageRoutes)

export default api
