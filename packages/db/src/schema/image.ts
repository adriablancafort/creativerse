import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const imageSession = pgTable(
  "image_session",
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
    index("image_session_organizationId_idx").on(table.organizationId),
    index("image_session_updatedAt_idx").on(table.updatedAt),
  ]
)

export const imageGeneration = pgTable(
  "image_generation",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => imageSession.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    count: integer("count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("image_generation_sessionId_idx").on(table.sessionId),
    index("image_generation_createdAt_idx").on(table.createdAt),
  ]
)

export const generatedImage = pgTable(
  "generated_image",
  {
    id: text("id").primaryKey(),
    generationId: text("generation_id")
      .notNull()
      .references(() => imageGeneration.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    status: text("status").default("pending").notNull(),
    url: text("url"),
    error: text("error"),
  },
  (table) => [index("generated_image_generationId_idx").on(table.generationId)]
)

export type ImageSession = typeof imageSession.$inferSelect
export type ImageGeneration = typeof imageGeneration.$inferSelect
export type GeneratedImage = typeof generatedImage.$inferSelect
