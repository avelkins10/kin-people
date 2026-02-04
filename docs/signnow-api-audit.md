# SignNow API Audit

This document lists every SignNow API call used by the app and how it aligns with the official **SignNow API Postman collection** (`SignNow API.postman_collection.json` in the project root). Use it when changing `lib/integrations/signnow.ts` or debugging integration issues.

**Resources for agents:** See **docs/signnow-integration-resources.md** for MCPs (SignNow + SignNow API Helper), Postman collection, and other docs to use when building SignNow integrations.

---

## Endpoints we use

| App usage | Our endpoint | Postman / official | Notes |
|-----------|--------------|-------------------|--------|
| **Auth** | `POST https://api.signnow.com/oauth2/token` | `POST {{url}}/oauth2/token` | ✅ Same. Body: `username`, `password`, `grant_type=password` (or `grant_type=client_credentials`). Header: `Authorization: Basic <base64(apiKey:apiSecret)>`. |
| **List templates** | `GET /v2/templates` then fallback `GET /user/folder` + `GET /folder/{{id}}` | No `GET /v2/templates` in collection. Collection has **Get all folders** (`GET /user/folder`) and **Get folder by id** (`GET /folder/{{folder_id}}`). | We try `/v2/templates` first; if it fails or returns empty, we use folder-based listing (Templates folder → documents in folder). |
| **Template copies** | `GET /v2/templates/{{template_id}}/copies` | **Get list of documents from template**: `GET {{url}}/v2/templates/{{template_id}}/copies` | ✅ Same. |
| **Create doc from template** | `POST /template/{{template_id}}/copy` | **Get document out of template**: `POST /template/{{template_id}}/copy`. Body: `document_name` only. | ✅ Same. We use legacy path; v2 path `/documents` does not exist. |
| **Send invite** | `POST /v2/documents/{{documentId}}/invite` | **Field Invite**: `POST /document/{{document_id}}/invite` (no v2). Body in Postman: `to`, `from`, `subject`, `message`; we send `invites`, `from`, `subject`, `message`. | v2 API may accept `invites` array; Postman shows legacy `to` array. |
| **Get document status** | `GET /v2/documents/{{documentId}}` | **Get document**: `GET /document/{{document_id}}` (no v2). | We use v2; both may be supported. |
| **Void document** | `PUT /v2/document/fieldinvitecancel` with body `{ document_id }` | **Cancel field invite**: `PUT {{url}}/document/{{document_id}}/fieldinvitecancel` (document_id in path, no v2). | We use v2 singular `document` with document_id in body; Postman uses path param. |
| **Download document** | `GET /v2/documents/{{documentId}}/download` | Not explicitly shown in collection snippet; v2 document download is standard. | ✅ Keep as-is. |

---

## Document statuses (app)

The app uses a single `status` field on `documents` with these values (see `types/documents.ts` enum `DocumentStatus`):

| Status | When set | UI (badge) |
|--------|----------|------------|
| `pending` | On create; after send (sentAt) | Yellow "Pending" |
| `viewed` | Webhook `document.open` | Blue "Viewed" |
| `partially_signed` | Webhook `document.fieldinvite.signed` when signedCount < totalSigners | Orange "Partially Signed" |
| `signed` | Webhook `document.fieldinvite.signed` when all signed, or `document.complete` | Green "Signed" |
| `expired` | Webhook `invite.expired` | Red "Expired" |
| `voided` | Resend flow (void old doc) or document-helpers `voidDocument()` | Gray "Voided" |

- **Resend** is only allowed when status is effectively expired: either `expired` (webhook) or still `pending`/`viewed`/`partially_signed` but `expiresAt` &lt; now. Signed and voided documents cannot be resent.
- **Expired documents banner** and **GET /api/documents?status=expired** list documents with `status === "expired"`. The service `getExpiredDocuments()` (when used) includes pending/viewed/partially_signed/expired with `expiresAt` &lt; now so webhook-marked and date-passed are both included.

---

## Webhook

- **URL:** `POST https://<your-domain>/api/webhooks/signnow`
- **GET:** We respond with `200 OK` so SignNow can validate the URL when registering the webhook.
- **POST:** We expect body fields `event` and `document_id`. We also accept `meta.event` and `content.document_id` (User-scoped webhooks may send that shape).
- **Events we handle:** `document.open`, `document.fieldinvite.signed`, `invite.expired`, `document.complete`.
- **Signature:** Header `X-SignNow-Signature`; we verify with HMAC-SHA256(payload, `SIGNNOW_WEBHOOK_SECRET`). We try both hex and Base64 encoding of the HMAC.

---

## Checklist for changes

1. **New endpoint** – Prefer v2 paths when available; confirm request/response shape against Postman collection or SignNow docs.
2. **Auth** – All calls use Bearer token from `getAccessToken()` (password or client_credentials).
3. **Errors** – Preserve and surface SignNow error messages (e.g. in API route and `getTemplates` / `getTemplateCopies`).
4. **Webhook** – Keep GET handler for URL validation; keep payload normalization for `event` and `document_id`.

---

See **docs/signnow-document-management.md** (API reference section) for where to find the Postman collection and when to use it.
