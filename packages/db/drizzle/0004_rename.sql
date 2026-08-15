ALTER TABLE "image_session" RENAME TO "create_image_session";--> statement-breakpoint
ALTER TABLE "image_generation" RENAME TO "create_image_turn";--> statement-breakpoint
ALTER TABLE "generated_image" RENAME TO "created_image";--> statement-breakpoint
ALTER TABLE "video_session" RENAME TO "create_video_session";--> statement-breakpoint
ALTER TABLE "video_generation" RENAME TO "created_video";--> statement-breakpoint
ALTER TABLE "enhance_generation" RENAME TO "created_enhance";--> statement-breakpoint
ALTER TABLE "created_image" RENAME COLUMN "generation_id" TO "turn_id";--> statement-breakpoint
ALTER TABLE "created_enhance" DROP CONSTRAINT "enhance_generation_session_id_enhance_session_id_fk";
--> statement-breakpoint
ALTER TABLE "created_image" DROP CONSTRAINT "generated_image_generation_id_image_generation_id_fk";
--> statement-breakpoint
ALTER TABLE "create_image_turn" DROP CONSTRAINT "image_generation_session_id_image_session_id_fk";
--> statement-breakpoint
ALTER TABLE "create_image_session" DROP CONSTRAINT "image_session_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "create_image_session" DROP CONSTRAINT "image_session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "created_video" DROP CONSTRAINT "video_generation_session_id_video_session_id_fk";
--> statement-breakpoint
ALTER TABLE "create_video_session" DROP CONSTRAINT "video_session_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "create_video_session" DROP CONSTRAINT "video_session_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "enhance_generation_sessionId_idx";--> statement-breakpoint
DROP INDEX "enhance_generation_createdAt_idx";--> statement-breakpoint
DROP INDEX "generated_image_generationId_idx";--> statement-breakpoint
DROP INDEX "image_generation_sessionId_idx";--> statement-breakpoint
DROP INDEX "image_generation_createdAt_idx";--> statement-breakpoint
DROP INDEX "image_session_organizationId_idx";--> statement-breakpoint
DROP INDEX "image_session_updatedAt_idx";--> statement-breakpoint
DROP INDEX "video_generation_sessionId_idx";--> statement-breakpoint
DROP INDEX "video_generation_createdAt_idx";--> statement-breakpoint
DROP INDEX "video_session_organizationId_idx";--> statement-breakpoint
DROP INDEX "video_session_updatedAt_idx";--> statement-breakpoint
ALTER TABLE "created_enhance" ADD CONSTRAINT "created_enhance_session_id_enhance_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."enhance_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "created_image" ADD CONSTRAINT "created_image_turn_id_create_image_turn_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."create_image_turn"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "create_image_turn" ADD CONSTRAINT "create_image_turn_session_id_create_image_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."create_image_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "create_image_session" ADD CONSTRAINT "create_image_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "create_image_session" ADD CONSTRAINT "create_image_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "created_video" ADD CONSTRAINT "created_video_session_id_create_video_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."create_video_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "create_video_session" ADD CONSTRAINT "create_video_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "create_video_session" ADD CONSTRAINT "create_video_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "created_enhance_sessionId_idx" ON "created_enhance" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "created_enhance_createdAt_idx" ON "created_enhance" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "created_image_turnId_idx" ON "created_image" USING btree ("turn_id");--> statement-breakpoint
CREATE INDEX "create_image_turn_sessionId_idx" ON "create_image_turn" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "create_image_turn_createdAt_idx" ON "create_image_turn" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "create_image_session_organizationId_idx" ON "create_image_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "create_image_session_updatedAt_idx" ON "create_image_session" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "created_video_sessionId_idx" ON "created_video" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "created_video_createdAt_idx" ON "created_video" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "create_video_session_organizationId_idx" ON "create_video_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "create_video_session_updatedAt_idx" ON "create_video_session" USING btree ("updated_at");