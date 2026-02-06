# Supabase Migration Status

This doc summarizes what’s required for the Kin People App on Supabase (tables, seed data, storage, migrations) and what’s already applied vs. what you need to do manually.

---

## References

- **Supabase setup**: `SUPABASE-TESTING-PLAN.md`, `DEPLOYMENT.md`
- **Storage & RLS**: `docs/supabase-storage-agreements.md`, `drizzle/0001_supabase_agreements_bucket_rls.sql`
- **Auth**: `docs/authentication.md`. Invite/password-reset: see **Auth: invite and password reset** below.
- **Pilot setup**: `docs/pilot-setup-workflow.md`
- **Env**: `docs/vercel-environment-variables.md`, `.env.example`, `supabase-credentials.template.md`

---

## Tables (all created)

These **16 public tables** are expected and have been created on Supabase:

| Table | Purpose |
|-------|--------|
| `roles` | RBAC roles (Admin, Office Manager, Team Lead, Sales Rep, Area Director, Regional Manager) |
| `offices` | Offices/regions |
| `pay_plans` | Commission pay plans |
| `teams` | Teams (optional office/team_lead) |
| `people` | Reps/managers; links to Supabase Auth via `auth_user_id` (uuid) |
| `deals` | Deals (setter, closer, office, etc.) |
| `commissions` | Commission rows per deal/person |
| `commission_rules` | Rules per pay plan (setter/closer/override) |
| `commission_history` | Status change history for commissions |
| `activity_log` | Audit log (entity/action/actor) |
| `person_teams` | Person ↔ team membership |
| `person_pay_plans` | Person ↔ pay plan (effective dates) |
| `person_history` | Person change history |
| `org_snapshots` | Org snapshot per person/date (for commission calc) |
| `recruits` | Recruiting pipeline (includes `agreement_document_path`) |
| `recruit_history` | Recruit status history |

Indexes and foreign keys for these tables are in place.

---

## Seed data (applied via MCP or script)

- **Roles**: Sales Rep, Team Lead, Area Director, Regional Manager, Admin, **Office Manager** (required by `lib/permissions/roles.ts` and pilot workflow).
- **Offices**: Utah HQ, Pilot Office (and optionally more via `npm run db:seed`).
- **Pay plans**: Standard Setter Plan, Standard Closer Plan, Team Lead Plan.

**Optional – full seed (roles, offices, pay plans, commission rules):**

```bash
npm run db:seed
```

Run with `DATABASE_URL` in `.env.local` pointing at your Supabase DB (e.g. IPv4 pooler). This adds more offices and the full set of **commission rules** (setter/closer/override rules) used by the commission calculator. Without these, deals/commissions and Settings → Commission rules will be empty until you add rules in the app or run the seed.

---

## Storage: `agreements` bucket and RLS

**Bucket**: Created via MCP. **Policies**: Applied via Dashboard (or debug agent). RLS on `storage.objects` is enabled by default in Supabase; you only need to create the two SELECT policies. If policy subqueries fail, grant `SELECT ON public.people, public.roles, public.recruits TO authenticated` so the USING clauses can read those tables. See `scripts/apply-storage-rls.sql` for the full script (includes GRANTs and optional indexes).

Legacy note – migration `drizzle/0001_supabase_agreements_bucket_rls.sql` does two things:

1. Creates the **`agreements`** storage bucket (private, 50MB, PDF only).
2. Enables RLS on `storage.objects` and creates two SELECT policies (users see their own agreements; Admins/Owner see all).

**These steps cannot be applied via the app’s migration runner or MCP** (they require the Supabase owner). Do them in the Supabase project:

1. **Supabase Dashboard → SQL Editor**  
   Run the contents of `drizzle/0001_supabase_agreements_bucket_rls.sql` (or the equivalent SQL from `docs/supabase-storage-agreements.md`).

   **Or**:

2. **Dashboard → Storage**  
   - Create a bucket named `agreements`, private, 50MB limit, MIME types `application/pdf`.  
   - Then in **SQL Editor** run only the RLS parts (enable RLS on `storage.objects`, create the two policies from the migration or doc).

Until this is done, recruiting agreement uploads/downloads that use the `agreements` bucket may fail or be inaccessible.

---

## Auth: invite and password reset

Invite and password-reset flows must land on a URL that can establish a session and then sync the Supabase Auth user to the `people` table (`auth_user_id`). The app handles both **PKCE** (URL with `?code=...`) and **implicit** (URL with `#access_token=...&refresh_token=...`) so links work regardless of Supabase project flow.

**Supabase Dashboard – URL Configuration**

In **Authentication → URL Configuration**, set:

- **Site URL**: Your app origin (e.g. `https://gokinnect.com`).
- **Redirect URLs**: Add both so invite/recovery links can land on either and still work:
  - `https://gokinnect.com/auth-callback`
  - `https://gokinnect.com/confirm`

The API passes `redirectTo: ${origin}/auth-callback?next=/set-password` when inviting or resending; Supabase may still send some links to `/confirm` depending on template or flow. Both `/auth-callback` and `/confirm` now handle hash, code, and `token_hash` + `type`, and both call `POST /api/auth/sync-user` to link the Supabase user to the matching `people` row by email (`auth_user_id`).

**User linking**

- `POST /api/auth/sync-user` (called after confirmation) finds a `people` row by email and sets `auth_user_id`, or creates a placeholder person with default role "Sales Rep" and status "onboarding". Invited users should already have a person row (created when the admin added them); sync-user links that row to the new Supabase auth user.

---

## Drizzle migration history

Schema was applied via Supabase MCP (and/or `db:push`), not via `npm run db:migrate`. So:

- **0000** (`people.auth_user_id` uuid, `recruits.agreement_document_path`) – already reflected in the current schema (we created tables with these columns).
- **0001** – storage bucket + RLS: apply manually in Dashboard as above.

If you later run `npm run db:migrate`, it may try to run 0000/0001 again. 0000 may no-op or error harmlessly; 0001 will only work when run in the Dashboard. Keeping a note that “schema was applied via MCP / push” avoids confusion.

---

## Checklist

| Item | Status |
|------|--------|
| All 16 public tables + FKs + indexes | Done (via MCP) |
| Roles (incl. Office Manager) | Done |
| Offices (min 2) | Done |
| Pay plans (3) | Done |
| Commission rules (full set) | Optional: run `npm run db:seed` |
| Storage bucket `agreements` | Done (via MCP) |
| RLS policies on `storage.objects` for agreements | Done (policies + GRANT SELECT on people/roles/recruits to authenticated) |
| `DATABASE_URL` (e.g. IPv4 pooler) | In `.env.local` / Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` + anon key | In `.env.local` / Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` (pilot, server-side) | In `.env.local` / Vercel (optional for basic login) |
| Auth redirect URLs (`auth-callback`, `confirm`) | Supabase Dashboard → Authentication → URL Configuration (see **Auth: invite and password reset** above) |

---

## Quick reference: env and commands

- **Env**: See `.env.example` and `docs/vercel-environment-variables.md`. Use IPv4-compatible pooler for `DATABASE_URL` if you hit `EHOSTUNREACH`.
- **Migrations**: `npm run db:migrate` (applies `drizzle/*.sql`; 0001 storage/RLS must be done in Dashboard).
- **Schema push**: `npm run db:push` (Drizzle schema → DB; requires config + `DATABASE_URL`).
- **Full seed**: `npm run db:seed` (roles, offices, pay plans, commission rules).
- **Pilot users**: `docs/pilot-setup-workflow.md`, `npm run db:seed-pilot`, `npm run db:verify-pilot`.
