# SignNow Integration Resources

**For developers and AI agents:** Use these resources when building or changing SignNow integrations in this app. Prefer MCP tools and the Postman collection to confirm endpoints and payloads before editing `lib/integrations/signnow.ts` or related APIs.

---

## MCPs (use these first)

We have two SignNow-related MCP servers. Use them to look up API behavior and to validate flows without guessing.

| MCP server | Purpose | When to use |
|------------|---------|-------------|
| **project-0-kin people app-signnow** | Full SignNow API: templates, create from template, send invite, get document, download, embedded flows, update fields. | To see available operations, request/response shapes, and to compare with app behavior (e.g. create from template vs our `template/copy` usage). |
| **project-0-kin people app-signnow-api-helper** | SignNow API documentation lookup. | To search API docs by topic (e.g. “free form invite”, “template copy”, “webhook”). Call **get_signnow_api_info** with a `query` string. |

**MCP setup:** See **docs/mcp-signnow-setup.md** for credentials (`SIGNNOW_API_BASIC_TOKEN`, `SIGNNOW_USER_EMAIL`, `SIGNNOW_PASSWORD`). The SignNow MCP uses the same credentials as the app.

---

## Postman collection

- **File:** `SignNow API.postman_collection.json` (project root)
- **What it is:** Official SignNow API collection (endpoints, auth, request/response bodies).
- **When to use it:** To confirm exact paths and body format (e.g. `POST /template/{{template_id}}/copy` with `document_name` for creating a document from a template; v2 paths like `v2/templates/{{template_id}}/copy` may differ). Prefer checking the collection before adding or changing an API call.

---

## Docs (reference and alignment)

| Doc | Contents |
|-----|----------|
| **docs/signnow-api-audit.md** | Table of every SignNow endpoint the app uses, v2 vs legacy, webhook events, and a short checklist for changes. |
| **docs/signnow-document-management.md** | User-facing guide (send, track, resend, templates) and API reference section pointing to Postman + audit. |
| **docs/signnow-mcp-vs-app.md** | MCP tools vs app implementation (create from template, invite, fields, void, etc.). |
| **docs/mcp-signnow-setup.md** | How to configure the SignNow MCP (env vars, basic token). |
| **docs/signnow-go-live.md** | Go-live checklist (env, webhook URL, templates, etc.). |
| **docs/signnow-supabase-requirements.md** | Supabase storage/RLS and document-related schema. |

---

## Quick checklist for agents

1. **New or changed SignNow API call** – Check the Postman collection for the correct path and body; use **signnow-api-helper** MCP `get_signnow_api_info` with a query if needed. Update **docs/signnow-api-audit.md** if you add or change an endpoint.
2. **Templates / create from template** – App uses `POST /template/{{template_id}}/copy` with `document_name` only (not `v2/templates/.../documents`). Invites use legacy `POST /document/{{id}}/invite` with role_id (SDK or direct API); avoid v2 invite endpoint (can 404).
3. **Webhook** – Events handled: `document.open`, `document.fieldinvite.signed`, `document.fieldinvite.decline`, `document.fieldinvite.email.delivery.failed`, `document.update`, `invite.expired`, `document.complete`. User-scoped webhooks send events with `user.` prefix (e.g. `user.document.complete`); the handler strips this automatically. Payload has `meta.event` and `content.documentId` (or `content.document_id`). See **app/api/webhooks/signnow/route.ts**.
4. **MCPs** – Prefer **signnow** and **signnow-api-helper** MCPs to look up API behavior before implementing or debugging.
5. **Smart fields vs fillable fields** – See **docs/signnow-document-management.md** (“Smart fields and pre-fill”). Smart fields = optional pre-filled text (name, email, etc.) via integration_objects + prefill API. Fillable fields = role-based fields; invite may require **role_id** if the template has predefined roles.
6. **Role-based invite (Quickstart)** – SignNow’s flow: add fields with roles → GET document → send invite with **role_id** from document roles. We try v2 invite first; on 400/422 we call `getDocumentRoles(documentId)` and retry with legacy `POST /document/{id}/invite` and `to: [{ email, role, role_id, order, ... }]`.
7. **SDK vs direct API** – The app **defaults to the SDK** for create-from-template and send-invite. Set `USE_SIGNNOW_SDK=false` in Vercel to use the direct API instead. All other calls (prefill, void, download, webhook, templates list) use `lib/integrations/signnow.ts`. Same env vars (OAuth) apply; no extra SDK config needed.

---

## What the SDK allows (vs direct API)

| Capability | SDK (v1.8.2 wrapper) | Direct API |
|------------|----------------------|------------|
| Create document from template | ✅ `Template.duplicate` → `POST /template/{id}/copy` (legacy) | ✅ Same legacy endpoint |
| Get document roles | ✅ `Document.view` → `GET /document/{id}` (legacy) | ✅ v2 first, fallback to legacy |
| Send invites (multi-signer) | ✅ `Document.invite` → `POST /document/{id}/invite` (legacy) | ✅ Same legacy endpoint |
| Prefill smart fields | ❌ Not in SDK wrapper; uses direct API | ✅ `POST /document/{id}/integration/object/smartfields` |
| Templates list, void, download, webhook | ❌ Not in SDK; uses direct API | ✅ All in `signnow.ts` |

**SDK wrapper** (`lib/integrations/signnow-sdk.ts`) only replaces **create document**, **get roles**, and **send invites**. Everything else (templates, prefill, void, download, webhook verification) still goes through `lib/integrations/signnow.ts`.

---

## Is the SDK better than what we're currently doing?

**Yes, for the create + invite flow.** Reasons:

1. **Legacy endpoints only** – The npm SDK (v1.8.2) uses **legacy** paths (`/template/{id}/copy`, `/document/{id}`, `/document/{id}/invite`). Some SignNow accounts or regions return 404 for **v2** endpoints (`v2/templates/.../documents`, `v2/documents/.../invite`). Using the SDK avoids those v2 routes entirely for create and invite.
2. **Official client** – Same request shapes and URL building as SignNow’s own client, so fewer mismatches as the API evolves.
3. **Default on** – The app uses the SDK for create/invite unless you set `USE_SIGNNOW_SDK=false`. Direct API is still used for templates, prefill, void, download, and webhooks; it also has a legacy fallback for `getDocumentRoles` when v2 returns 404.

If you see 404s on preview or send, ensure `USE_SIGNNOW_SDK` is not set to `false` (or set it to `true` explicitly) and redeploy so the SDK path is used.

---

## Migrating to SignNow SDK v3

To switch from the npm v1.8.2 SDK to the local v3 SDK (TypeScript, request/response classes), use **docs/signnow-v3-migration-spec.md**. That spec is the full handoff for an agent (e.g. Claude Code): steps, file paths, env mapping, v3 API usage, and which MCPs/docs to use.

---

## SignNow Node.js SDK (local v3 source)

A copy of the official SignNow Node.js SDK source (v3.0.0) is available locally for reference:

- **Path:** `SignNowNodeSDK-master` (e.g. `/Users/austinelkins/Downloads/SignNowNodeSDK-master` or sibling to the app repo).
- **What it is:** TypeScript v3 SDK with request/response classes (`Sdk`, `CloneTemplatePostRequest`, `SendInvitePostRequest`, `DocumentGetRequest`, etc.), Promise-based `client.send(request)`.
- **v3 vs npm:** The **npm** package `@signnow/api-client` currently installs **v1.8.2** (callback-based, legacy `/template/{id}/copy`, `/document/{id}/invite`). The **downloaded repo** is **v3.0.0** (same legacy paths, but TypeScript + request classes). Our wrapper in `lib/integrations/signnow-sdk.ts` uses the **npm v1.8.2** API; the local v3 source is for reference or a future migration to v3 (e.g. link via `file:../SignNowNodeSDK-master` after building `dist/` and mapping env: `SIGNNOW_API_HOST`, `SIGNNOW_API_BASIC_TOKEN`, `SIGNNOW_API_USERNAME`, `SIGNNOW_API_PASSWORD`).
- **Useful v3 files:** `src/api/template/request/cloneTemplatePost.ts`, `src/api/documentInvite/request/sendInvitePost.ts`, `src/api/document/request/documentGet.ts`, `examples/documentInvite/fieldInvitePost.ts`, `examples/template/cloneTemplatePost.ts`.
