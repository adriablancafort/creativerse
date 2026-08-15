import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const createImageSession = pgTable(
  "create_image_session",
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
    index("create_image_session_organizationId_idx").on(table.organizationId),
    index("create_image_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const createImageTurn = pgTable(
  "create_image_turn",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => createImageSession.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    count: integer("count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("create_image_turn_sessionId_idx").on(table.sessionId),
    index("create_image_turn_createdAt_idx").on(table.createdAt),
  ]
)

export const createdImage = pgTable(
  "created_image",
  {
    id: text("id").primaryKey(),
    turnId: text("turn_id")
      .notNull()
      .references(() => createImageTurn.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    status: text("status").default("pending").notNull(),
    url: text("url"),
    error: text("error"),
  },
  (table) => [index("created_image_turnId_idx").on(table.turnId)]
)

export type CreateImageSession = typeof createImageSession.$inferSelect
export type CreateImageTurn = typeof createImageTurn.$inferSelect
export type CreatedImage = typeof createdImage.$inferSelect
