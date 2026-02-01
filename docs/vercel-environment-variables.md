# Vercel Environment Variables

Add these in **Vercel** → your project → **Settings** → **Environment Variables**.  
Use **Production** (and optionally **Preview**) for each variable.

---

## Required for production

| Name | Description | Where to get it |
|------|-------------|-----------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Supabase → **Settings** → **Database** → Connection string (URI). Use the **Transaction** pooler if you prefer. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → **Settings** → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side auth | Supabase → **Settings** → **API** → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side operations | Supabase → **Settings** → **API** → service_role |

---

## Recommended

| Name | Description | Example / where to get it |
|------|-------------|---------------------------|
| `NEXT_PUBLIC_APP_URL` | Production URL (for API calls from server) | `https://your-app.vercel.app` or your custom domain |

---

## Optional (SignNow)

Only if you use SignNow integration:

| Name | Description |
|------|-------------|
| `SIGNNOW_API_KEY` | SignNow API key |
| `SIGNNOW_API_SECRET` | SignNow API secret |
| `SIGNNOW_TEMPLATE_ID` | SignNow template ID |
| `SIGNNOW_WEBHOOK_SECRET` | SignNow webhook secret |
| `SIGNNOW_FROM_EMAIL` | From email for SignNow (e.g. `noreply@yourdomain.com`) |

---

## After adding variables

1. Save each variable for **Production** (and **Preview** if you use preview deploys).
2. **Redeploy** the latest deployment (Deployments → ⋮ → Redeploy) so the new env vars are picked up.
