-- Supabase Storage: agreements bucket and RLS policies
-- Runs only when the DB user has ownership of storage.objects (e.g. Supabase dashboard).
-- When connecting as postgres without storage ownership, this migration no-ops so later migrations can run.
DO $$
BEGIN
  -- 1. Create the agreements bucket if missing
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('agreements', 'agreements', false, 52428800, ARRAY['application/pdf'])
  ON CONFLICT (id) DO NOTHING;

  -- 2. Enable RLS on storage.objects
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- 3. Drop existing policies so migration is idempotent
  DROP POLICY IF EXISTS "Users can view their own agreements" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all agreements" ON storage.objects;

  -- 4. Policy: Users can view their own agreements
  CREATE POLICY "Users can view their own agreements"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND (storage.foldername(name))[1] IN (
      SELECT 'recruit-' || r.id::text FROM public.recruits r
      WHERE r.recruiter_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
         OR r.converted_to_person_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
    )
  );

  -- 5. Policy: Admins can view all agreements
  CREATE POLICY "Admins can view all agreements"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND EXISTS (
      SELECT 1 FROM public.people p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.auth_user_id = auth.uid() AND r.name IN ('Admin', 'Owner')
    )
  );
EXCEPTION
  WHEN insufficient_privilege OR OTHERS THEN
    -- Skip when not owner of storage.objects (e.g. postgres over direct connection)
    NULL;
END $$;
