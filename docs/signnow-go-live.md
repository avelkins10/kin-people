# SignNow Document Feature — Go-Live Checklist

## Done (this session)

- **Code committed and pushed**  
  Branch: `feature/signnow-config`  
  PR: https://github.com/avelkins10/kin-people/pull/new/feature/signnow-config

- **Migrations run locally**  
  `npm run db:migrate` completed; `documents` and `document_templates` exist in the DB pointed to by your local `DATABASE_URL` (`.env` / `.env.local`).

---

## You do for production

### 1. Merge and deploy

- Open the PR above (or merge `feature/signnow-config` into your main branch).
- Let your host (e.g. Vercel) deploy from the merged branch.

### 2. Run migrations on production DB

Migrations must run **once** against the **production** database:

```bash
DATABASE_URL="your-production-database-url" npm run db:migrate
```

Use the same connection string you use in production (e.g. from Vercel → Project → Settings → Environment Variables). That creates `documents` and `document_templates` in prod.

### 3. Set production environment variables

In your hosting dashboard (e.g. Vercel → Project → Settings → Environment Variables), add or confirm:

| Variable | Purpose |
|---------|--------|
| `SIGNNOW_API_KEY` | SignNow API key |
| `SIGNNOW_API_SECRET` | SignNow API secret |
| `SIGNNOW_WEBHOOK_SECRET` | Verify webhook payloads |
| `SIGNNOW_FROM_EMAIL` | Sender for invite emails |

Also ensure production has the correct `DATABASE_URL` and any Supabase env vars (e.g. for Storage).

### 4. Register webhook in SignNow

In the SignNow dashboard, set the webhook URL to your production base URL, e.g.:

`https://your-production-domain.com/api/webhooks/signnow`

---

## References

- **SignNow API (Postman collection):** `SignNow API.postman_collection.json` in the project root — use this for exact endpoints, auth, and response shapes when configuring or debugging SignNow. See also `docs/signnow-document-management.md` (API reference section).

---

After 2–4, the document feature is live in production.
