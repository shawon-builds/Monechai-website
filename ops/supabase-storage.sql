-- Apply with the owner/migration role AFTER Supabase Auth/Storage are provisioned.
-- Create public bucket products in Dashboard with MIME image/webp, max 5 MiB.
-- Do not add private to the Data API exposed schemas.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.monechai_storage_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT COALESCE(auth.jwt()->>'aal','') = 'aal2'
    AND EXISTS (SELECT 1 FROM public.admin_members m JOIN auth.users u ON u.id=m.user_id WHERE m.user_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION private.monechai_storage_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.monechai_storage_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.monechai_product_image_path(path text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NOT private.monechai_storage_admin() OR path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$' THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.products WHERE id=split_part(path,'/',1)::uuid AND NOT is_demo);
END $$;
REVOKE ALL ON FUNCTION private.monechai_product_image_path(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.monechai_product_image_path(text) TO authenticated;

DROP POLICY IF EXISTS monechai_product_images_read ON storage.objects;
CREATE POLICY monechai_product_images_read ON storage.objects FOR SELECT TO anon,authenticated
USING (bucket_id='products');
DROP POLICY IF EXISTS monechai_product_images_insert ON storage.objects;
CREATE POLICY monechai_product_images_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='products' AND private.monechai_product_image_path(name));
DROP POLICY IF EXISTS monechai_product_images_delete ON storage.objects;
CREATE POLICY monechai_product_images_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='products' AND private.monechai_storage_admin());
-- No UPDATE policy: app uploads immutable random keys rather than replacing files.

-- Restrictive write rules also constrain any older permissive policy. Public photo
-- reads remain available; other buckets keep their independently reviewed policies.
DROP POLICY IF EXISTS monechai_products_anon_insert_guard ON storage.objects;
CREATE POLICY monechai_products_anon_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon
WITH CHECK (bucket_id <> 'products');
DROP POLICY IF EXISTS monechai_products_anon_delete_guard ON storage.objects;
CREATE POLICY monechai_products_anon_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon
USING (bucket_id <> 'products');
DROP POLICY IF EXISTS monechai_products_anon_update_guard ON storage.objects;
CREATE POLICY monechai_products_anon_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon
USING (bucket_id <> 'products')
WITH CHECK (bucket_id <> 'products');
DROP POLICY IF EXISTS monechai_products_authenticated_insert_guard ON storage.objects;
CREATE POLICY monechai_products_authenticated_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'products' OR private.monechai_product_image_path(name));
DROP POLICY IF EXISTS monechai_products_authenticated_delete_guard ON storage.objects;
CREATE POLICY monechai_products_authenticated_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (bucket_id <> 'products' OR private.monechai_storage_admin());
DROP POLICY IF EXISTS monechai_products_authenticated_update_guard ON storage.objects;
CREATE POLICY monechai_products_authenticated_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (bucket_id <> 'products')
WITH CHECK (bucket_id <> 'products');
