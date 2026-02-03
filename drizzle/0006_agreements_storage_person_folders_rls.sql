-- Storage RLS: allow authenticated users to view agreements in person-{id} folder when they are that person.
-- Download API uses service-role signed URLs (bypass RLS), but this keeps RLS consistent for person documents.
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view person agreements (own)" ON storage.objects;

  CREATE POLICY "Users can view person agreements (own)"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND (storage.foldername(name))[1] IN (
      SELECT 'person-' || p.id::text FROM public.people p
      WHERE p.auth_user_id = auth.uid()
    )
  );
EXCEPTION
  WHEN insufficient_privilege OR OTHERS THEN
    NULL;
END $$;
