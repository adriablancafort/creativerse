import {
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const enhanceSession = pgTable(
  "enhance_session",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("enhance_session_organizationId_idx").on(table.organizationId),
    index("enhance_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const createdEnhance = pgTable(
  "created_enhance",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => enhanceSession.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    sourceUrl: text("source_url").notNull(),
    model: text("model").notNull(),
    prompt: text("prompt"),
    scale: real("scale"),
    creativity: real("creativity"),
    detail: real("detail"),
    shapePreservation: real("shape_preservation"),
    upscaleMode: text("upscale_mode"),
    targetResolution: text("target_resolution"),
    noiseScale: real("noise_scale"),
    topazModel: text("topaz_model"),
    targetFps: integer("target_fps"),
    status: text("status").default("pending").notNull(),
    url: text("url"),
    error: text("error"),
    falRequestId: text("fal_request_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("created_enhance_sessionId_idx").on(table.sessionId),
    index("created_enhance_createdAt_idx").on(table.createdAt),
  ]
)

export type EnhanceSession = typeof enhanceSession.$inferSelect
export type CreatedEnhance = typeof createdEnhance.$inferSelect
