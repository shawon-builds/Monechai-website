-- Owner/migration connection only, after migrations 0000–0013.
-- First create LOGIN role monechai_runtime with a privately generated password:
-- NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS.
-- Never grant this role to anon/authenticated/authenticator/service_role.
-- Server authorization remains required before every admin read/mutation.
GRANT CONNECT ON DATABASE postgres TO monechai_runtime;
GRANT USAGE ON SCHEMA public TO monechai_runtime;

DO $$
DECLARE t text; privileges text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_members','categories','products','product_variants','product_images',
    'orders','order_items','order_status_history','order_payment_history',
    'order_inventory_history','shipping_zones','delivery_areas','site_settings',
    'store_policies','request_limits','order_notifications','admin_mutation_history'
  ] LOOP
    IF t IN ('admin_members','admin_mutation_history') THEN privileges := 'SELECT';
    ELSIF t='site_settings' THEN privileges := 'SELECT, UPDATE';
    ELSIF t IN ('order_status_history','order_payment_history','order_inventory_history') THEN privileges := 'SELECT, INSERT';
    ELSIF t IN ('orders','order_items','store_policies','order_notifications') THEN privileges := 'SELECT, INSERT, UPDATE';
    ELSE privileges := 'SELECT, INSERT, UPDATE, DELETE';
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM monechai_runtime',t);
    EXECUTE format('GRANT %s ON TABLE public.%I TO monechai_runtime',privileges,t);
    EXECUTE format('DROP POLICY IF EXISTS monechai_server_access ON public.%I',t);
    IF t IN ('admin_members','admin_mutation_history') THEN
      EXECUTE format('CREATE POLICY monechai_server_access ON public.%I FOR SELECT TO monechai_runtime USING (true)',t);
    ELSE
      EXECUTE format('CREATE POLICY monechai_server_access ON public.%I FOR ALL TO monechai_runtime USING (true) WITH CHECK (true)',t);
    END IF;
  END LOOP;
END $$;

-- Membership bootstrap and migration history stay restricted to the owner.
REVOKE ALL ON SCHEMA auth, storage, drizzle FROM monechai_runtime;
REVOKE ALL ON FUNCTION public.record_admin_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.preserve_policy_revision() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.preserve_order_consent() FROM PUBLIC;
ALTER ROLE monechai_runtime SET statement_timeout='10s';
ALTER ROLE monechai_runtime SET lock_timeout='5s';
ALTER ROLE monechai_runtime SET idle_in_transaction_session_timeout='20s';
