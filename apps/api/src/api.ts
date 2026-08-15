import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { auth } from "@/lib/auth/config"
import { env } from "@/lib/env"
import { enhanceRoutes } from "@/routes/enhance"
import { imageRoutes } from "@/routes/image"
import { videoRoutes } from "@/routes/video"

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
api.route("/api/video", videoRoutes)
api.route("/api/enhance", enhanceRoutes)

export default api
