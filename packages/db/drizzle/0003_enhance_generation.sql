CREATE TABLE "enhance_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"media_type" text NOT NULL,
	"source_url" text NOT NULL,
	"model" text NOT NULL,
	"prompt" text,
	"scale" real,
	"creativity" real,
	"detail" real,
	"shape_preservation" real,
	"upscale_mode" text,
	"target_resolution" text,
	"noise_scale" real,
	"topaz_model" text,
	"target_fps" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"url" text,
	"error" text,
	"fal_request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enhance_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enhance_generation" ADD CONSTRAINT "enhance_generation_session_id_enhance_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."enhance_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhance_session" ADD CONSTRAINT "enhance_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhance_session" ADD CONSTRAINT "enhance_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enhance_generation_sessionId_idx" ON "enhance_generation" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "enhance_generation_createdAt_idx" ON "enhance_generation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enhance_session_organizationId_idx" ON "enhance_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "enhance_session_updatedAt_idx" ON "enhance_session" USING btree ("updated_at");