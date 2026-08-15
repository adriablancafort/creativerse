import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const createVideoSession = pgTable(
  "create_video_session",
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
    index("create_video_session_organizationId_idx").on(table.organizationId),
    index("create_video_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const createdVideo = pgTable(
  "created_video",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => createVideoSession.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    duration: integer("duration").notNull(),
    resolution: text("resolution"),
    generateAudio: boolean("generate_audio").notNull(),
    startFrameUrl: text("start_frame_url"),
    endFrameUrl: text("end_frame_url"),
    status: text("status").default("pending").notNull(),
    url: text("url"),
    error: text("error"),
    falRequestId: text("fal_request_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("created_video_sessionId_idx").on(table.sessionId),
    index("created_video_createdAt_idx").on(table.createdAt),
  ]
)

export type CreateVideoSession = typeof createVideoSession.$inferSelect
export type CreatedVideo = typeof createdVideo.$inferSelect
