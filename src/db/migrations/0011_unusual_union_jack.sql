CREATE TABLE "store_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipping_en" text NOT NULL,
	"shipping_bn" text,
	"returns_en" text NOT NULL,
	"returns_bn" text,
	"privacy_en" text NOT NULL,
	"privacy_bn" text,
	"terms_en" text NOT NULL,
	"terms_bn" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_policy_content" CHECK (length(trim("store_policies"."shipping_en")) > 0 AND length(trim("store_policies"."returns_en")) > 0 AND length(trim("store_policies"."privacy_en")) > 0 AND length(trim("store_policies"."terms_en")) > 0)
);
--> statement-breakpoint
ALTER TABLE "store_policies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "label_bn" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "policy_version_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "policy_accepted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_store_policy" ON "store_policies" USING btree ("is_active") WHERE "store_policies"."is_active" = true;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_policy_version_id_store_policies_id_fk" FOREIGN KEY ("policy_version_id") REFERENCES "public"."store_policies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_policy_consent_pair" CHECK (("orders"."policy_version_id" IS NULL) = ("orders"."policy_accepted_at" IS NULL));
--> statement-breakpoint
REVOKE ALL ON TABLE public.store_policies FROM PUBLIC;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE public.store_policies FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE public.store_policies FROM authenticated; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN REVOKE ALL ON TABLE public.store_policies FROM service_role; END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION preserve_policy_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF (to_jsonb(OLD) - 'is_active') IS DISTINCT FROM (to_jsonb(NEW) - 'is_active') THEN
    RAISE EXCEPTION 'Published policy revisions are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER store_policy_revision_immutable BEFORE UPDATE ON store_policies FOR EACH ROW EXECUTE FUNCTION preserve_policy_revision();
--> statement-breakpoint
CREATE FUNCTION preserve_order_consent() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF OLD.policy_version_id IS DISTINCT FROM NEW.policy_version_id OR OLD.policy_accepted_at IS DISTINCT FROM NEW.policy_accepted_at THEN
    RAISE EXCEPTION 'Order policy consent is immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER order_consent_immutable BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION preserve_order_consent();
