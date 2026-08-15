CREATE TABLE "edit_image_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edited_image" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"source_url" text NOT NULL,
	"resolution" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"url" text,
	"error" text,
	"fal_request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "edit_image_session" ADD CONSTRAINT "edit_image_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_image_session" ADD CONSTRAINT "edit_image_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edited_image" ADD CONSTRAINT "edited_image_session_id_edit_image_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."edit_image_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edit_image_session_organizationId_idx" ON "edit_image_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "edit_image_session_updatedAt_idx" ON "edit_image_session" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "edited_image_sessionId_idx" ON "edited_image" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "edited_image_createdAt_idx" ON "edited_image" USING btree ("created_at");