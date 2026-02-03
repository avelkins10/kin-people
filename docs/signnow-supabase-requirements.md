# SignNow: Supabase tables, fields, and storage

Checklist of what must exist in Supabase for the SignNow document flow.

---

## 1. Database tables (migrations)

| Table | Migration | Purpose |
|-------|-----------|--------|
| **documents** | `0005_documents_and_templates.sql` | SignNow document records (recruit or person); `signnow_document_id`, `storage_path`, status, etc. |
| **document_templates** | `0005_documents_and_templates.sql` | Config per document type; `signnow_template_id`, signers, expiration, etc. Seeds: rep_agreement, tax_forms, onboarding_checklist, offer_letter. |

Run `npm run db:migrate` so 0005 is applied (and 0005 is in `drizzle/meta/_journal.json`).

---

## 2. Recruits table (existing)

The **recruits** table is used when sending a Rep Agreement: we set `status = 'agreement_sent'` and `agreement_sent_at`. The schema expects:

- `status` (varchar) – includes `agreement_sent`, `agreement_signed`, etc.
- `agreement_sent_at` (timestamp)
- `agreement_signed_at`, `agreement_document_path`, `signnow_document_id`, `agreement_document_url` (optional for legacy/single-doc flow)

These are **not** added by 0000–0005; 0000 only adds `agreement_document_path`. If your DB was created from a full schema (e.g. Supabase SQL or an older migration), recruits already has these. If you created the DB from scratch with only the migrations in this repo and **recruits** was never created, you need a base migration that creates **recruits** with these columns (or add the missing columns). In most setups the recruits table already exists with the right columns.

---

## 3. Storage: agreements bucket

- **Bucket:** `agreements` (private, PDF only, 50MB limit).
- **Created by:** `0001_supabase_agreements_bucket_rls.sql` (inside a `DO $$ ... EXCEPTION ... END $$` block). If the migration runs with a user that doesn’t own `storage.objects` (e.g. direct Postgres connection), the bucket insert can no-op.
- **If the bucket is missing:** Create it in Supabase Dashboard → Storage → New bucket: name `agreements`, private, file size limit 52428800, allowed MIME types `application/pdf`.

---

## 4. Storage RLS (policies)

- **0001** adds:
  - “Users can view their own agreements” – `agreements` bucket, folder prefix **recruit-** where the user is the recruiter or the converted person.
  - “Admins can view all agreements” – Admin/Owner can read all objects in `agreements`.

- **Person documents** are stored under `person-{personId}/`. Admins can already see them. **0006** adds a policy so the authenticated user can view objects in `person-{id}` when they are that person (own documents). **0007** adds “Users can view managed people storage documents” so managers can view `person-*` folders for people who report to them. Download API uses service-role signed URLs, so downloads work either way; RLS keeps direct client access consistent.

---

## 5. RLS on documents and document_templates (0007)

**0007_documents_and_templates_rls.sql** enables RLS and adds the planner’s policies:

- **documents:** “Users can view their recruit documents”, “Users can view managed people documents”, “Admins can view all documents”.
- **document_templates:** “All users can view templates” (is_active = true), “Admins can manage templates”.
- **storage.objects:** “Users can view managed people storage documents” (managers see person-* for direct reports).

The app enforces permissions in API code (visibility-rules); these policies add defense-in-depth and apply when queries run as Supabase `authenticated` (e.g. direct client or dashboard).

---

## 6. Env / Supabase

- **Database:** `DATABASE_URL` (used by `npm run db:migrate` and the app).
- **Storage (server-side):** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (used by `lib/supabase/storage.ts` for upload and signed URL creation).

---

## Summary

- **Required for SignNow:** Tables **documents** and **document_templates** (0005), **agreements** bucket, RLS from 0001 (storage recruit + admin), 0006 (person own), 0007 (documents/document_templates RLS + storage manager). Recruits table with `status` and `agreement_sent_at` (and related columns) must exist.
- **Migrations:** 0005 (tables), 0006 (storage person-own), 0007 (documents/document_templates RLS + storage manager). Run `npm run db:migrate` so 0005–0007 are applied.
- **If something is missing:** Create the bucket manually if 0001 didn’t run as storage owner; ensure recruits table (and columns) exist; run migrations so 0005–0007 run.

---

## 7. Copy-paste for Supabase AI

Use this in the Supabase Dashboard AI / SQL assistant to verify everything is in place:

```
Audit this project for our SignNow document management setup. Check and report on each:

1. **Tables**
   - `documents`: exists, has RLS enabled, and has columns like id, signnow_document_id, storage_path, status, recruit_id, person_id, document_template_id, created_at.
   - `document_templates`: exists, has RLS enabled, and has signnow_template_id, slug (e.g. rep_agreement, tax_forms), is_active.
   - `recruits`: has status, agreement_sent_at, and ideally agreement_signed_at, agreement_document_path, signnow_document_id, agreement_document_url.

2. **RLS policies on documents**
   - "Users can view their recruit documents" (SELECT for recruit docs where recruiter is current user).
   - "Users can view managed people documents" (SELECT for person docs where person reports to current user).
   - "Admins can view all documents" (SELECT for Admin/Owner role).

3. **RLS policies on document_templates**
   - "All users can view templates" (SELECT where is_active = true).
   - "Admins can manage templates" (ALL for Admin/Owner).

4. **Storage**
   - Bucket `agreements` exists, private, with file size limit and PDF-only if configured.

5. **Storage RLS on storage.objects for bucket agreements**
   - Policy so users can view objects in recruit-* or person-* folders where they are the recruiter or the person.
   - Policy so admins can view all objects in agreements.
   - "Users can view person agreements (own)" for person-{id} where auth.uid() matches that person.
   - "Users can view managed people storage documents" for person-* folders where the person reports to the current user.

List any missing tables, columns, policies, or bucket config and suggest SQL to fix.
```

---

## 8. After the Supabase AI audit: what to apply and what to skip

Our app uses **`document_type`** (string) to link documents to templates, not **`document_template_id`** (FK). We use **`document_type`** on `document_templates` as the unique key (e.g. `rep_agreement`), not **`slug`**.

**Do apply (RLS + storage only):**

- Enable RLS on `documents` and `document_templates`.
- Add all three SELECT policies on `documents` (recruit, managed people, admins).
- Add both policies on `document_templates` (view active, admins manage).
- Add the two missing **storage** policies:
  - Person self-access: user can view `person-{id}/...` when they are that person.
  - Manager access: user can view `person-{id}/...` when that person reports to them.

**Do not apply:**

- **Do not** add `documents.document_template_id` or a FK to `document_templates` — we don’t use it.
- **Do not** add `document_templates.slug` — we use `document_type` as the identifier.

**Easiest: run our script in Supabase SQL Editor**

Use **`docs/supabase-apply-signnow-rls.sql`**: it enables RLS and creates all of the above policies (no extra columns). Run it in Supabase Dashboard → SQL Editor. If the AI already created a policy with a different name (e.g. “Users can view their own person agreements”), drop that policy first or run our script as-is; our script uses `DROP POLICY IF EXISTS` for the names we use.

---

## 9. Post-apply: quick validation

After RLS and storage policies are applied, you can sanity-check as follows.

| Who | Check |
|-----|--------|
| **Recruiter (non-admin)** | `SELECT` from `public.documents` returns rows for your recruits; files under `agreements/recruit-{recruit_id}/` are accessible. |
| **Manager** | `SELECT` from `public.documents` shows rows for direct reports; files under `agreements/person-{person_id}/` for those reports are accessible. |
| **Regular user** | Can read active `document_templates`; cannot modify templates unless Admin/Owner. |

**INSERT/UPDATE/DELETE on documents:** This app creates and updates documents only via API routes (send-document, webhooks) using the server-side DB connection. No Supabase client writes to `documents` as `authenticated`. You do **not** need RLS write policies on `documents` unless you add client-side direct writes later.
