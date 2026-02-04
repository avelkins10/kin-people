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
2. **Templates / create from template** – App uses `POST /template/{{template_id}}/copy` with `document_name` only (not `v2/templates/.../documents`). Invites are sent separately via `POST /v2/documents/{{id}}/invite`.
3. **Webhook** – Events: `document.open`, `document.fieldinvite.signed`, `invite.expired`, `document.complete`. Payload may have `event`/`document_id` at top level or under `meta`/`content`. See **signnow-api-audit.md** and **app/api/webhooks/signnow/route.ts**.
4. **MCPs** – Prefer **signnow** and **signnow-api-helper** MCPs to look up API behavior before implementing or debugging.
