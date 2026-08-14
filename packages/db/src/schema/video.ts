import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const videoSession = pgTable(
  "video_session",
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
    index("video_session_organizationId_idx").on(table.organizationId),
    index("video_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const videoGeneration = pgTable(
  "video_generation",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => videoSession.id, { onDelete: "cascade" }),
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
    index("video_generation_sessionId_idx").on(table.sessionId),
    index("video_generation_createdAt_idx").on(table.createdAt),
  ]
)

export type VideoSession = typeof videoSession.$inferSelect
export type VideoGeneration = typeof videoGeneration.$inferSelect
