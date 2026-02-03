# Setting Vercel env vars with the CLI

Use the [Vercel CLI](https://vercel.com/docs/cli) to add environment variables from the terminal.

## Prerequisites

1. **Install and link**
   ```bash
   npm install
   npm run vercel:link
   ```
   Follow the prompts to link this repo to your Vercel project (choose the right team and project).

2. **Log in** (if needed)
   ```bash
   npx vercel login
   ```

## Add variables

Use `production` (and optionally `preview`) so they apply to the right environments.

### Non-secret (safe to paste)

Run these from the project root. Replace the example values if yours differ.

```bash
# Supabase project URL
echo -n "https://uxjomymolbkfjmeovsvd.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Supabase anon (public) key
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4am9teW1vbGJrZmptZW92c3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODIxODAsImV4cCI6MjA4NTU1ODE4MH0.n4gKBqinaD-5V0n9k2G3x2ussO0nsbFL85NUC6aIEdg" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# App URL (your Vercel deployment URL)
echo -n "https://kin-people-app-git-main-avelkins10s-projects.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production
```

To also set them for **Preview** (branch deploys), run the same commands with `preview` instead of `production`, or add both in one go:

```bash
echo -n "https://uxjomymolbkfjmeovsvd.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production preview
```

### Secrets (avoid putting in shell history)

**Option A – Interactive (recommended)**  
CLI will prompt for the value; it won’t be stored in history.

```bash
npx vercel env add DATABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive
```

Paste the value when prompted.

**Option B – From a file**  
Put the value in a temporary file (e.g. one line in `tmp-db-url.txt`), then:

```bash
npx vercel env add DATABASE_URL production < tmp-db-url.txt
rm tmp-db-url.txt
```

Do the same for `SUPABASE_SERVICE_ROLE_KEY` if you use a file. Use `--sensitive` for the service role:

```bash
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive < tmp-service-role.txt
rm tmp-service-role.txt
```

**DATABASE_URL** should be your full Postgres URI, e.g.:

`postgres://postgres.YOUR_PASSWORD@db.uxjomymolbkfjmeovsvd.supabase.co:6543/postgres?sslmode=require`

Get the DB password from Supabase → Settings → Database. Prefer the **Transaction** pooler URI from the dashboard if it’s different.

**SUPABASE_SERVICE_ROLE_KEY** is in Supabase → Settings → API → `service_role` (secret). Never commit it or paste it in chat.

## List / pull / update

```bash
# List env vars for the project
npx vercel env ls

# Pull production env vars into .env.local (for local dev)
npm run vercel:env-pull

# Update an existing variable
npx vercel env update NEXT_PUBLIC_APP_URL production
```

## After adding or changing env vars

Redeploy so new values are used: Vercel Dashboard → Deployments → ⋮ on latest → **Redeploy**, or push a new commit.
