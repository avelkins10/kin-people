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

## Optional (SignNow document management)

Required only if you use the SignNow document management feature (send/track documents for recruits and people):

| Name | Description | Where to get it |
|------|-------------|-----------------|
| `SIGNNOW_API_KEY` | SignNow Client ID (OAuth) | SignNow app → OAuth 2.0 / API credentials |
| `SIGNNOW_API_SECRET` | SignNow Secret Key (OAuth) | SignNow app → OAuth 2.0 / API credentials |
| `SIGNNOW_USER_EMAIL` | SignNow account email (for password grant) | The SignNow user that owns the API app |
| `SIGNNOW_PASSWORD` | SignNow account password (for password grant) | Same account as above |
| `SIGNNOW_API_HOST` | **Required for v3 SDK.** SignNow API base URL | `https://api.signnow.com` (production) |
| `SIGNNOW_WEBHOOK_SECRET` | Secret used to verify webhook payloads (HMAC-SHA256) | SignNow webhook configuration; leave unset to skip verification |
| `SIGNNOW_FROM_EMAIL` | From address for invite emails (e.g. `noreply@yourdomain.com`) | Your sending domain |
| `USE_SIGNNOW_SDK` | SignNow: use SDK for create-from-template and send-invite. **Default is SDK** (unset or `true`). Set to `false` to use direct API only. | `true` or leave unset (recommended); `false` to disable SDK |

**⚠️ SIGNNOW_API_HOST is required.** The v3 SDK does not default to any base URL. If omitted, API requests will fail with "Only absolute URLs are supported". Always set it to `https://api.signnow.com`.

**Note:** SignNow’s token endpoint uses **password grant**. Set `SIGNNOW_USER_EMAIL` and `SIGNNOW_PASSWORD` (the account that owns the API app) so the app can fetch templates and create documents. Without them, you may see “Failed to retrieve SignNow templates.”

**Webhook URL (configure in SignNow dashboard):**

- Set the webhook URL to: `https://<your-production-domain>/api/webhooks/signnow`
- Use your production domain (e.g. `https://your-app.vercel.app` or custom domain).
- The app handles: `document.open`, `document.fieldinvite.signed`, `invite.expired`, `document.complete`.

**Legacy (single template):** `SIGNNOW_TEMPLATE_ID` is optional if you use the document templates feature (Settings → Organization → Documents); templates are configured per document type in the app.

See **docs/signnow-document-management.md** for user/admin guides and **docs/signnow-go-live.md** for deployment steps.

---

## After adding variables

1. Save each variable for **Production** (and **Preview** if you use preview deploys).
2. **Redeploy** the latest deployment (Deployments → ⋮ → Redeploy) so the new env vars are picked up.
