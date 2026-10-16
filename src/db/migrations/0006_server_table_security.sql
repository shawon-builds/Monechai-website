CREATE TABLE "request_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_payment_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_zones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "request_limits_expiry_idx" ON "request_limits" USING btree ("expires_at");
--> statement-breakpoint
-- This monolith serves all app data through its authenticated Node boundary.
-- Client Data API roles need no direct access, including a privileged Storage key.
DO $$
DECLARE app_table text; client_role text;
BEGIN
  FOREACH app_table IN ARRAY ARRAY['admin_members','categories','products','product_variants','product_images','orders','order_items','order_status_history','order_payment_history','shipping_zones','site_settings','request_limits'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', app_table);
    FOREACH client_role IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', app_table, client_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
