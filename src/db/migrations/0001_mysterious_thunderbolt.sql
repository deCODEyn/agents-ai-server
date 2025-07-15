CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_room" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"create_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_id_room_rooms_id_fk" FOREIGN KEY ("id_room") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;