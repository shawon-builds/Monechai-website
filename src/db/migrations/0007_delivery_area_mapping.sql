CREATE TABLE "delivery_areas" (
	"code" text PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"district" text NOT NULL,
	"shipping_zone_code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "delivery_area_code" CHECK ("delivery_areas"."code" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "delivery_areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_area_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_area_name" text;--> statement-breakpoint
ALTER TABLE "delivery_areas" ADD CONSTRAINT "delivery_areas_shipping_zone_code_shipping_zones_code_fk" FOREIGN KEY ("shipping_zone_code") REFERENCES "public"."shipping_zones"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_area_code_delivery_areas_code_fk" FOREIGN KEY ("delivery_area_code") REFERENCES "public"."delivery_areas"("code") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
REVOKE ALL ON TABLE public.delivery_areas FROM PUBLIC;
--> statement-breakpoint
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE public.delivery_areas FROM %I', r); END IF;
  END LOOP;
END $$;
