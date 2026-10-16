CREATE TABLE "order_inventory_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_release_quantity" CHECK ("order_inventory_history"."quantity" > 0),
	CONSTRAINT "inventory_release_reason" CHECK ("order_inventory_history"."reason" IN ('cancellation','return'))
);
--> statement-breakpoint
ALTER TABLE "order_inventory_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_payment_history" DROP CONSTRAINT "payment_history_cod_valid";--> statement-breakpoint
ALTER TABLE "order_status_history" DROP CONSTRAINT "history_from_valid";--> statement-breakpoint
ALTER TABLE "order_status_history" DROP CONSTRAINT "history_to_valid";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_status_valid";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "inventory_reserved" boolean;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "inventory_released" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_reference" text;--> statement-breakpoint
ALTER TABLE "order_inventory_history" ADD CONSTRAINT "order_inventory_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_inventory_history" ADD CONSTRAINT "order_inventory_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_release_once" ON "order_inventory_history" USING btree ("order_id","variant_id");--> statement-breakpoint
ALTER TABLE "order_payment_history" ADD CONSTRAINT "payment_history_cod_valid" CHECK (("order_payment_history"."from_status" = 'pending' AND "order_payment_history"."to_status" IN ('paid','failed')) OR ("order_payment_history"."from_status" = 'paid' AND "order_payment_history"."to_status" = 'refunded'));--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "history_from_valid" CHECK ("order_status_history"."from_status" IS NULL OR "order_status_history"."from_status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled','delivery_failed','return_requested','returned'));--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "history_to_valid" CHECK ("order_status_history"."to_status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled','delivery_failed','return_requested','returned'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_valid" CHECK ("orders"."status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled','delivery_failed','return_requested','returned'));
--> statement-breakpoint
REVOKE ALL ON TABLE public.order_inventory_history FROM PUBLIC;
--> statement-breakpoint
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE public.order_inventory_history FROM %I', r); END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.monechai_immutable_purchase_item() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF (NEW.product_name,NEW.product_sku,NEW.variant_sku,NEW.variant_label,NEW.attributes,NEW.quantity,NEW.unit_price_minor,NEW.line_total_minor,NEW.inventory_reserved)
    IS DISTINCT FROM (OLD.product_name,OLD.product_sku,OLD.variant_sku,OLD.variant_label,OLD.attributes,OLD.quantity,OLD.unit_price_minor,OLD.line_total_minor,OLD.inventory_reserved)
  THEN RAISE EXCEPTION 'Historical purchase items are immutable' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.monechai_immutable_purchase_item() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER monechai_immutable_purchase_item BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.monechai_immutable_purchase_item();
