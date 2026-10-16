CREATE TABLE "order_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_notifications_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "notification_status" CHECK ("order_notifications"."status" IN ('pending','processing','sent','failed')),
	CONSTRAINT "notification_attempts" CHECK ("order_notifications"."attempts" >= 0),
	CONSTRAINT "notification_error_safe" CHECK ("order_notifications"."last_error" IS NULL OR "order_notifications"."last_error" = 'DELIVERY_FAILED')
);
--> statement-breakpoint
ALTER TABLE "order_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_notifications" ADD CONSTRAINT "order_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_queue_idx" ON "order_notifications" USING btree ("status","next_attempt_at");
--> statement-breakpoint
REVOKE ALL ON TABLE public.order_notifications FROM PUBLIC;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE public.order_notifications FROM anon; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE public.order_notifications FROM authenticated; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN REVOKE ALL ON TABLE public.order_notifications FROM service_role; END IF;
END $$;
