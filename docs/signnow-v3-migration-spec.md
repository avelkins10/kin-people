# SignNow SDK v3 migration spec

**For the agent (e.g. Claude Code) performing the migration:** This doc is the single handoff. Do the steps in order. Use the MCPs and docs listed below to verify behavior.

---

## Goal

Replace the current SignNow integration for **create-from-template** and **send-invite** with the **v3 SDK** (TypeScript, request/response classes) from the local SignNowNodeSDK folder. Keep all other behavior (prefill, void, download, templates list, webhook) in `lib/integrations/signnow.ts` unchanged.

**Outcome:** `lib/integrations/signnow-sdk.ts` uses v3's `Sdk`, `CloneTemplatePostRequest`, `DocumentGetRequest`, `SendInvitePostRequest` instead of the npm `@signnow/api-client` v1.8.2. The app still uses the same env vars for OAuth where possible; only add v3-specific env if required.

---

## Prerequisites (for the agent)

- **Workspace:** Kin People app at project root (this repo).
- **v3 SDK source:** SignNow Node.js SDK v3 – either:
  - **Option A:** Folder at `SignNowNodeSDK-master` (e.g. `/Users/austinelkins/Downloads/SignNowNodeSDK-master`). If not in the repo, user will provide path or copy it into the repo (e.g. `vendor/SignNowNodeSDK`).
  - **Option B:** Add as dependency via `file:../SignNowNodeSDK-master` (or relative path) in `package.json` after building the SDK (`npm run build` in SDK folder; v3 has no `build` script in package.json – check for `tsc` or build instructions in SDK README).
- **Current behavior:** See `lib/integrations/signnow-sdk.ts` (v1.8.2 wrapper) and `lib/services/document-service.ts` (conditional `USE_SIGNNOW_SDK`). Document service calls: `createDocumentWithMultipleSigners`, `getDocumentRoles` (internal), `sendMultipleInvites`. Same function signatures must be preserved.

---

## MCPs and docs to use

**Point the agent to these.** Prefer MCPs when available.

| Resource | Purpose |
|----------|---------|
| **SignNow MCP** (e.g. `project-0-kin people app-signnow` or `signnow`) | List templates, create doc, send invite, get document – verify request/response shapes and compare with v3 SDK behavior. |
| **SignNow API helper MCP** (e.g. `project-0-kin people app-signnow-api-helper`) | `get_signnow_api_info` with query (e.g. "template copy", "document invite") to confirm payloads. |
| **Supabase MCP** | If any document/template or RLS changes are needed (this migration should not require DB changes). |
| **Vercel MCP** | To add or document env vars and confirm deploy after migration. |
| **docs/signnow-integration-resources.md** | Master list of SignNow resources, MCPs, Postman collection, SDK vs direct API. |
| **docs/mcp-signnow-setup.md** | SignNow MCP credentials: `SIGNNOW_API_BASIC_TOKEN` = base64(API_KEY:API_SECRET), `SIGNNOW_USER_EMAIL`, `SIGNNOW_PASSWORD`. |
| **SignNow API.postman_collection.json** (project root) | Official endpoints and bodies; use for legacy paths: `POST /template/{{template_id}}/copy`, `GET /document/{{id}}`, `POST /document/{{id}}/invite`. |

**Do you need to give Claude Code more MCPs?**  
- If Claude Code already has **Supabase** and **Vercel** MCPs: add the **SignNow** and **SignNow API helper** MCPs (same config as this project’s `.cursor/mcp.json` or `docs/mcp-signnow-setup.md`) so it can call the SignNow API and look up docs.  
- You can **point it to this repo’s docs**: open or attach `docs/signnow-integration-resources.md`, `docs/signnow-v3-migration-spec.md` (this file), and `docs/mcp-signnow-setup.md`. No need to duplicate content.

---

## Step-by-step tasks

### 1. Wire v3 SDK into the app

- Decide how the app will load v3:
  - **Option A:** Copy `SignNowNodeSDK-master` into the repo (e.g. `vendor/SignNowNodeSDK`) and add a dependency in `package.json` (e.g. `"@signnow/api-client": "file:./vendor/SignNowNodeSDK"`). Build the SDK first (see SDK’s README/package.json for `tsc` or build step); v3 exposes `dist/` via `exports`.
  - **Option B:** Use a relative path dependency (e.g. `file:../SignNowNodeSDK-master`) if the folder lives next to the app; ensure the SDK is built and that the path is valid for CI/Vercel (or build the SDK in a preinstall script).
- Ensure the app resolves `@signnow/api-client` to v3 (v3 package name is also `@signnow/api-client`; version 3.0.0). Remove or replace the existing npm `@signnow/api-client` (v1.8.2) so the app only uses v3 for the SDK path.
- Verify: `require('@signnow/api-client/core')` or `import { Sdk } from '@signnow/api-client/core'` and `import { CloneTemplatePostRequest, CloneTemplatePostResponse } from '@signnow/api-client/api/template'` (or equivalent v3 exports) resolve correctly.

### 2. Auth: use existing OAuth and set v3 host

- v3's `Sdk` uses `Config`: `SIGNNOW_API_HOST`, `SIGNNOW_API_BASIC_TOKEN`, `SIGNNOW_API_USERNAME`, `SIGNNOW_API_PASSWORD` (see `SignNowNodeSDK-master/src/core/config/config.ts`). The app currently uses `SIGNNOW_API_KEY`, `SIGNNOW_API_SECRET`, `SIGNNOW_USER_EMAIL`, `SIGNNOW_PASSWORD` and gets a bearer token via `getAccessToken()` in `lib/integrations/signnow.ts`.

**⚠️ CRITICAL: `SIGNNOW_API_HOST` is required.** The v3 SDK does NOT default to any base URL. If this env var is missing or empty, API requests will fail with "Only absolute URLs are supported". You **must** set:

```
SIGNNOW_API_HOST=https://api.signnow.com
```

in `.env.local` (local dev) and in Vercel (all environments).

- **Recommended:** Keep using our OAuth. In the v3 wrapper:
  - Ensure `SIGNNOW_API_HOST=https://api.signnow.com` is set in the environment.
  - Get the token with `getAccessToken()` from `lib/integrations/signnow.ts`.
  - Instantiate v3's `Sdk`, then call `sdk.setBearerToken(token)` (do not call `sdk.authenticate()` so we don't need v3's username/password/basic token in env).
  - Use `sdk.getClient().send(request)` for all v3 requests.
- **Optional:** Alternatively, add v3 env vars (`SIGNNOW_API_BASIC_TOKEN` = base64(API_KEY:API_SECRET), `SIGNNOW_API_USERNAME`, `SIGNNOW_API_PASSWORD`, `SIGNNOW_API_HOST`) and use `await new Sdk().authenticate()` and remove the call to our `getAccessToken()`. Document any new vars in `docs/vercel-environment-variables.md` and `docs/mcp-signnow-setup.md`.

### 3. Rewrite `lib/integrations/signnow-sdk.ts` to use v3

- Replace the v1.8.2 `require('@signnow/api-client')` and callback-based calls with v3 request/response classes. Keep the same **exported** function signatures so `lib/services/document-service.ts` does not need changes (other than possibly removing the v1.8.2 conditional if we fully switch to v3 for create/invite).

**Implement these three flows:**

1. **createDocumentWithMultipleSigners(templateId, signers, documentName, fieldValues?)**
   - v3: `CloneTemplatePostRequest` (see `SignNowNodeSDK-master/src/api/template/request/cloneTemplatePost.ts`). Constructor: `(templateId, documentName, clientTimestamp?, folderId?)`. Payload uses `template_id`, `document_name`. URL: `/template/{template_id}/copy`. Response: `CloneTemplatePostResponse` with `id`, `name`.
   - Return the created document `id` (string).

2. **getDocumentRoles(documentId)** (used internally by sendMultipleInvites)
   - v3: `DocumentGetRequest` (see `SignNowNodeSDK-master/src/api/document/request/documentGet.ts`). URL: `/document/{document_id}`. Response type has `roles: Role[]`; `Role` has `unique_id`, `name` (see `SignNowNodeSDK-master/src/api/document/response/data/role.ts`).
   - Return array of `{ unique_id: string; name?: string }` to match current interface.

3. **sendMultipleInvites(documentId, signers, options?)**
   - v3: `SendInvitePostRequest` (see `SignNowNodeSDK-master/src/api/documentInvite/request/sendInvitePost.ts`). Constructor takes `documentId`, `to: To[]`, `from`, `subject`, `message`, and optional cc/viewers/etc. `To` type (see `SignNowNodeSDK-master/src/api/documentInvite/request/data/to/to.ts`): `email`, `role_id`, `role`, `order`, `subject`, `message`, `reminder?`, `expiration_days?`, `reassign?`, `decline_by_signature?`, etc.
   - First call getDocumentRoles(documentId), then build `to[]` from signers and roles (same logic as current v1.8.2 wrapper). Use `from` = `process.env.SIGNNOW_FROM_EMAIL || 'noreply@example.com'`, and options for subject, message, expirationDays, reminderDays. Map to v3’s `To` (subject/message can be per-recipient or same for all; use same subject/message for all if v3 allows).
   - Send via `client.send(SendInvitePostRequest)`.

- Keep **error handling** consistent with current wrapper (throw on empty signers, expirationDays > 180, role count < signer count). Preserve the same **InviteOptions** and **SignerConfig** types (import from `@/lib/integrations/signnow`).

### 4. Env and docs

- **`SIGNNOW_API_HOST=https://api.signnow.com` is required** — add to `.env`, `.env.local`, and Vercel (all environments). Without it, the SDK cannot make requests.
- Document this in `docs/vercel-environment-variables.md` (done) and, if relevant, `docs/mcp-signnow-setup.md`.
- In `docs/signnow-integration-resources.md`, update the “SignNow Node.js SDK (local v3 source)” section to state that the app **uses v3** for create/invite (and where the dependency lives – e.g. `vendor/SignNowNodeSDK` or `file:../SignNowNodeSDK-master`). Update the “What the SDK allows” table to say “v3” instead of “v1.8.2 wrapper” where appropriate.

### 5. Remove v1.8.2 and default to v3

- Remove the npm package `@signnow/api-client` (v1.8.2) from `package.json` so the app only depends on v3 for the SDK path.
- In `lib/services/document-service.ts`, keep using the SDK wrapper for create/invite. The conditional `USE_SIGNNOW_SDK` can remain so that setting `USE_SIGNNOW_SDK=false` falls back to **direct API** (signnow.ts), not v1.8.2. So: when `USE_SIGNNOW_SDK !== 'false'`, use v3 wrapper; when `false`, use direct API.

### 6. Verify

- Run `npm run build` (or `next build`) and fix any type or import errors.
- If the agent has SignNow MCP: list templates, create a document from a template, send an invite (or run the app and use UI preview/send) and confirm no 404s and correct behavior.
- Optionally run existing tests; if there are none for SignNow, manual check of “preview document” and “send document” is enough.

---

## File reference (current app)

| File | Role |
|------|------|
| `lib/integrations/signnow.ts` | Direct API: OAuth `getAccessToken()`, templates, prefill, void, download, webhook. **Do not change** except if you need to export something for v3. |
| `lib/integrations/signnow-sdk.ts` | **Replace** v1.8.2 usage with v3 request/response classes; keep same exported function names and signatures. |
| `lib/services/document-service.ts` | Conditional: `createDocumentWithMultipleSigners` and `sendMultipleInvites` from SDK wrapper when `USE_SIGNNOW_SDK !== 'false'`. No signature changes needed. |
| `docs/signnow-integration-resources.md` | Update SDK section to reflect v3. |
| `docs/vercel-environment-variables.md` | Document any new env vars. |

---

## v3 SDK paths (quick reference)

- **Auth:** `Sdk` in `@signnow/api-client/core`; `setBearerToken(token)` to use our token; `getClient().send(request)`.
- **Create from template:** `CloneTemplatePostRequest` from `@signnow/api-client/api/template`; response `CloneTemplatePostResponse` has `id`.
- **Get document (roles):** `DocumentGetRequest` from `@signnow/api-client/api/document`; response has `roles` with `unique_id`, `name`.
- **Send invite:** `SendInvitePostRequest` from `@signnow/api-client/api/documentInvite`; body includes `to: To[]`, `from`, `subject`, `message`. `To`: `email`, `role_id`, `role`, `order`, `subject`, `message`, `reminder?`, `expiration_days?`.

---

## Summary for the user

- **What to give Claude Code:** This file (`docs/signnow-v3-migration-spec.md`) plus pointers to `docs/signnow-integration-resources.md` and `docs/mcp-signnow-setup.md`. If Claude Code has Supabase and Vercel MCPs, add the **SignNow** and **SignNow API helper** MCPs so it can verify API behavior; you can point it to the repo’s docs instead of pasting everything.
- **MCPs:** SignNow + SignNow API helper are recommended for this migration. Supabase and Vercel are already available; use them for env/deploy if needed.
- **Docs:** Pointing to the docs folder (and this spec) is enough; no need to duplicate content.
