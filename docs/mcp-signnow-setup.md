# SignNow MCP setup

The SignNow MCP server needs valid SignNow credentials so tools like `list_all_templates` can call the API. A **403 Access denied** on the token endpoint usually means one of these is wrong or missing.

## 1. Use the same API credentials as the app

The MCP expects **SIGNNOW_API_BASIC_TOKEN**: the Base64-encoded string of your API key and secret:

```text
base64(SIGNNOW_API_KEY + ":" + SIGNNOW_API_SECRET)
```

Your app already uses `SIGNNOW_API_KEY` and `SIGNNOW_API_SECRET` (e.g. in Vercel or `.env`). Use that **same** key and secret to build the basic token.

**Generate the token (macOS/Linux):**

```bash
echo -n "YOUR_SIGNNOW_API_KEY:YOUR_SIGNNOW_API_SECRET" | base64
```

Paste the result into `SIGNNOW_API_BASIC_TOKEN` (in `.cursor/mcp.json` or in your env).

Get the key and secret from the [SignNow API dashboard](https://app.signnow.com) → API tab → your application.

## 2. Use the account that owns the API app

- **SIGNNOW_USER_EMAIL** and **SIGNNOW_PASSWORD** must be the SignNow account that owns the API application (the one that has the API key/secret).
- If the basic token is correct but you still get 403, check that this account has API access and that the password is correct.

## 3. Where to set the variables

**Option A – Env vars (recommended)**

In `.cursor/mcp.json` the SignNow server can use env references:

```json
"env": {
  "SIGNNOW_USER_EMAIL": "${env:SIGNNOW_USER_EMAIL}",
  "SIGNNOW_PASSWORD": "${env:SIGNNOW_PASSWORD}",
  "SIGNNOW_API_BASIC_TOKEN": "${env:SIGNNOW_API_BASIC_TOKEN}"
}
```

Then set the three variables in your environment before starting Cursor, for example:

- In a `.env` or `.env.local` in the project root (if your setup loads it into the shell), or  
- In your shell profile:  
  `export SIGNNOW_USER_EMAIL=...`  
  `export SIGNNOW_PASSWORD=...`  
  `export SIGNNOW_API_BASIC_TOKEN=...`  
  and start Cursor from that shell.

**Option B – Values in mcp.json**

You can put the three values directly in `.cursor/mcp.json` under the `signnow` server’s `env` block. Prefer Option A so secrets are not committed.

## 4. Checklist

- [ ] **SIGNNOW_API_BASIC_TOKEN** = `base64(API_KEY:API_SECRET)` from the same app as `SIGNNOW_API_KEY` / `SIGNNOW_API_SECRET`.
- [ ] **SIGNNOW_USER_EMAIL** / **SIGNNOW_PASSWORD** = SignNow account that owns that API app.
- [ ] Restart Cursor after changing env or `mcp.json` so the MCP picks up the new config.

After this, the SignNow MCP (e.g. `list_all_templates`) should authenticate successfully.
