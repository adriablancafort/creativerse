CREATE TABLE "video_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"duration" integer NOT NULL,
	"resolution" text,
	"generate_audio" boolean NOT NULL,
	"start_frame_url" text,
	"end_frame_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"url" text,
	"error" text,
	"fal_request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_generation" ADD CONSTRAINT "video_generation_session_id_video_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."video_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_session" ADD CONSTRAINT "video_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_session" ADD CONSTRAINT "video_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_generation_sessionId_idx" ON "video_generation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "video_generation_createdAt_idx" ON "video_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "video_session_organizationId_idx" ON "video_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "video_session_updatedAt_idx" ON "video_session" USING btree ("updated_at");