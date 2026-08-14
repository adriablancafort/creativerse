CREATE TABLE "generated_image" (
	"id" text PRIMARY KEY NOT NULL,
	"generation_id" text NOT NULL,
	"index" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"url" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "image_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_image" ADD CONSTRAINT "generated_image_generation_id_image_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."image_generation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation" ADD CONSTRAINT "image_generation_session_id_image_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."image_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_session" ADD CONSTRAINT "image_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_session" ADD CONSTRAINT "image_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generated_image_generationId_idx" ON "generated_image" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "image_generation_sessionId_idx" ON "image_generation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "image_generation_createdAt_idx" ON "image_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_session_organizationId_idx" ON "image_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "image_session_updatedAt_idx" ON "image_session" USING btree ("updated_at");