import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const editImageSession = pgTable(
  "edit_image_session",
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
    index("edit_image_session_organizationId_idx").on(table.organizationId),
    index("edit_image_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const editedImage = pgTable(
  "edited_image",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => editImageSession.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    sourceUrl: text("source_url").notNull(),
    resolution: text("resolution"),
    status: text("status").default("pending").notNull(),
    url: text("url"),
    error: text("error"),
    falRequestId: text("fal_request_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("edited_image_sessionId_idx").on(table.sessionId),
    index("edited_image_createdAt_idx").on(table.createdAt),
  ]
)

export type EditImageSession = typeof editImageSession.$inferSelect
export type EditedImage = typeof editedImage.$inferSelect
