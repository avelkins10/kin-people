# Supabase Storage: agreements Bucket and RLS

Run the following in the Supabase Dashboard → SQL Editor (or via migrations) after creating the `agreements` bucket.

## 1. Create the bucket (Dashboard or SQL)

**Option A – Supabase Dashboard**

1. Go to Storage → New bucket.
2. Name: `agreements`.
3. Public: **off** (private).
4. File size limit: 50 MB (or as needed).
5. Allowed MIME types: `application/pdf`.

**Option B – SQL** (if your project allows bucket creation via SQL)

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agreements',
  'agreements',
  false,
  52428800,  -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

## 2. Enable RLS on storage.objects

RLS is usually already enabled on `storage.objects`. If not:

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## 3. RLS policies

These policies assume:

- `people.auth_user_id` = Supabase Auth user ID.
- Recruit folder layout: `recruit-{recruit.id}/agreement-....pdf`.

**Policy 1: Users can view their own agreements**

(Recruiter or converted person for that recruit.)

```sql
CREATE POLICY "Users can view their own agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements'
  AND (storage.foldername(name))[1] IN (
    SELECT 'recruit-' || r.id::text
    FROM recruits r
    WHERE r.recruiter_id IN (SELECT id FROM people WHERE auth_user_id = auth.uid())
       OR r.converted_to_person_id IN (SELECT id FROM people WHERE auth_user_id = auth.uid())
  )
);
```

**Policy 2: Admins can view all agreements**

(Users with role name `Admin` or `Owner`.)

```sql
CREATE POLICY "Admins can view all agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements'
  AND EXISTS (
    SELECT 1 FROM people p
    JOIN roles r ON p.role_id = r.id
    WHERE p.auth_user_id = auth.uid()
      AND r.name IN ('Admin', 'Owner')
  )
);
```

**Service role**

The service role key bypasses RLS. No extra policy is needed for server-side uploads or signed URL generation using `SUPABASE_SERVICE_ROLE_KEY`.

## 4. Drop policies (if re-running)

```sql
DROP POLICY IF EXISTS "Users can view their own agreements" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all agreements" ON storage.objects;
```
