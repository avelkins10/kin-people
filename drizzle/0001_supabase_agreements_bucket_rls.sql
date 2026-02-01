-- Supabase Storage: agreements bucket and RLS policies
-- Creates the agreements bucket if missing and applies SELECT policies for authenticated users and admins.
-- Run against the target Supabase project (e.g. via db:migrate when DATABASE_URL points to Supabase).

-- 1. Create the agreements bucket if missing (private, 50MB, PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agreements',
  'agreements',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
-- 2. Enable RLS on storage.objects (no-op if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- 3. Drop existing policies so migration is idempotent
DROP POLICY IF EXISTS "Users can view their own agreements" ON storage.objects;
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can view all agreements" ON storage.objects;
--> statement-breakpoint
-- 4. Policy: Users can view their own agreements (recruiter or converted person for that recruit)
CREATE POLICY "Users can view their own agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements'
  AND (storage.foldername(name))[1] IN (
    SELECT 'recruit-' || r.id::text
    FROM public.recruits r
    WHERE r.recruiter_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
       OR r.converted_to_person_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
  )
);
--> statement-breakpoint
-- 5. Policy: Admins can view all agreements (role Admin or Owner)
CREATE POLICY "Admins can view all agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements'
  AND EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.auth_user_id = auth.uid()
      AND r.name IN ('Admin', 'Owner')
  )
);
