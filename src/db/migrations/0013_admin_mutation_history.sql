-- Incremental only: never backfill guessed actors or audit ordinary checkout stock writes.
CREATE TABLE public.admin_mutation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  changes jsonb NOT NULL,
  occurred_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT admin_history_action CHECK (action IN ('insert','update','delete')),
  CONSTRAINT admin_history_resource CHECK (resource_type IN ('categories','products','product_variants','product_images','orders','shipping_zones','delivery_areas','site_settings','store_policies')),
  CONSTRAINT admin_history_resource_id CHECK (length(resource_id) BETWEEN 1 AND 150),
  CONSTRAINT admin_history_changes CHECK (jsonb_typeof(changes)='object' AND changes <> '{}'::jsonb AND octet_length(changes::text)<=16000)
);
--> statement-breakpoint
ALTER TABLE public.admin_mutation_history ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX admin_history_resource_time_idx ON public.admin_mutation_history(resource_type, resource_id, occurred_at, id);
--> statement-breakpoint
CREATE INDEX admin_history_time_idx ON public.admin_mutation_history(occurred_at, id);
--> statement-breakpoint
REVOKE ALL ON TABLE public.admin_mutation_history FROM PUBLIC;
--> statement-breakpoint
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','monechai_runtime'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.admin_mutation_history FROM %I',r);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='monechai_runtime') THEN
    GRANT SELECT ON TABLE public.admin_mutation_history TO monechai_runtime;
    CREATE POLICY monechai_server_access ON public.admin_mutation_history FOR SELECT TO monechai_runtime USING (true);
  END IF;
END $$;
--> statement-breakpoint
-- Fixed path, no request-body serialization, no bearer tokens/contact fields.
-- Only this trigger writes history; the runtime cannot insert/update/delete it.
CREATE FUNCTION public.record_admin_mutation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  actor text := nullif(current_setting('monechai.admin_actor',true),'');
  before_row jsonb := CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  after_row jsonb := CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  changes jsonb := '{}'::jsonb;
  field text; mode text; prior jsonb; next_value jsonb;
BEGIN
  IF actor IS NULL THEN RETURN NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_members WHERE user_id=actor::uuid) THEN
    RAISE EXCEPTION 'Admin membership is no longer active' USING ERRCODE='42501';
  END IF;
  -- Arguments are migration-owned field:mode pairs. raw is limited to UUID/numeric/boolean/known enum values.
  FOREACH field IN ARRAY TG_ARGV LOOP
    mode := split_part(field,':',2); field := split_part(field,':',1);
    prior := before_row->field; next_value := after_row->field;
    IF prior IS NOT DISTINCT FROM next_value THEN CONTINUE; END IF;
    IF mode='hash' THEN
      prior := CASE WHEN prior IS NULL OR prior='null'::jsonb THEN 'null'::jsonb ELSE to_jsonb(encode(sha256(convert_to(prior::text,'UTF8')),'hex')) END;
      next_value := CASE WHEN next_value IS NULL OR next_value='null'::jsonb THEN 'null'::jsonb ELSE to_jsonb(encode(sha256(convert_to(next_value::text,'UTF8')),'hex')) END;
    ELSIF mode='redact' THEN
      prior := to_jsonb('redacted'::text); next_value := to_jsonb('redacted'::text);
    ELSIF mode <> 'raw' THEN RAISE EXCEPTION 'Invalid audit field mode';
    END IF;
    changes := changes || jsonb_build_object(field,jsonb_build_object('previous',prior,'next',next_value));
  END LOOP;
  IF changes <> '{}'::jsonb THEN
    INSERT INTO public.admin_mutation_history(actor_user_id,action,resource_type,resource_id,changes)
    VALUES(actor::uuid,lower(TG_OP),TG_TABLE_NAME,coalesce(after_row->>'id',before_row->>'id',after_row->>'code',before_row->>'code'),changes);
  END IF;
  RETURN NULL;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.record_admin_mutation() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER categories_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('slug:hash','name_en:hash','name_bn:hash','sort_order:raw');
--> statement-breakpoint
CREATE TRIGGER products_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('slug:hash','sku:hash','category_id:raw','name_en:hash','name_bn:hash','description_en:hash','description_bn:hash','price_minor:raw','compare_at_minor:raw','is_published:raw','is_featured:raw','is_demo:raw','badge:hash');
--> statement-breakpoint
CREATE TRIGGER variants_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('product_id:raw','sku:hash','label:hash','label_bn:hash','attributes:hash','price_minor:raw','track_inventory:raw','stock_quantity:raw','is_active:raw');
--> statement-breakpoint
CREATE TRIGGER images_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.product_images FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('product_id:raw','storage_key:redact','alt_en:hash','alt_bn:hash','sort_order:raw','is_primary:raw','verified_at:hash','content_hash:hash');
--> statement-breakpoint
-- Existing status/payment/inventory-release histories remain the sole owners of those fields.
CREATE TRIGGER tracking_admin_history AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('courier_name:hash','tracking_reference:hash');
--> statement-breakpoint
CREATE TRIGGER zones_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.shipping_zones FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('name:hash','fee_minor:raw','free_above_minor:raw');
--> statement-breakpoint
CREATE TRIGGER areas_admin_history AFTER INSERT OR UPDATE OR DELETE ON public.delivery_areas FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('name_en:hash','name_bn:hash','district:hash','shipping_zone_code:raw','is_active:raw');
--> statement-breakpoint
CREATE TRIGGER settings_admin_history AFTER UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('store_name:hash','whatsapp_number:redact','hotline:redact','support_email:redact','contact_address:redact','cod_enabled:raw');
--> statement-breakpoint
CREATE TRIGGER policies_admin_history AFTER INSERT OR UPDATE ON public.store_policies FOR EACH ROW EXECUTE FUNCTION public.record_admin_mutation('shipping_en:hash','shipping_bn:hash','returns_en:hash','returns_bn:hash','privacy_en:hash','privacy_bn:hash','terms_en:hash','terms_bn:hash','is_active:raw');
