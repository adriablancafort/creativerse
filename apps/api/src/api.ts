import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { auth } from "@/lib/auth/config"
import { env } from "@/lib/env"
import { createImageRoutes } from "@/routes/create-image"
import { createVideoRoutes } from "@/routes/create-video"
import { editImageRoutes } from "@/routes/edit-image"
import { enhanceRoutes } from "@/routes/enhance"

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

api.route("/api/create-image", createImageRoutes)
api.route("/api/edit-image", editImageRoutes)
api.route("/api/create-video", createVideoRoutes)
api.route("/api/enhance", enhanceRoutes)

export default api
