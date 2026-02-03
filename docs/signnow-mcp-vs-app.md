# SignNow MCP vs App Implementation

This document compares the SignNow MCP server’s tools and capabilities with our app’s SignNow integration and confirms alignment with `docs/signnow-document-management.md` and the Tech Plan / Core Flows.

---

## MCP tools vs our code

| MCP tool | SignNow API (conceptually) | Our app usage | Status |
|----------|----------------------------|---------------|--------|
| **list_all_templates** | GET templates / template groups | `getTemplates()` → `GET /v2/templates`; used by `/api/signnow/templates` and template-service cache | ✅ Aligned |
| **create_from_template** | Create document/group from template (no invite yet) | `createDocumentWithMultipleSigners()` → `POST /v2/templates/{id}/documents` with `field_invites`, `field_values` | ✅ Aligned |
| **send_invite** | Send invite on existing document/group | `sendMultipleInvites()` → `POST /v2/documents/{id}/invite` with `invites`, `expiration_days`, `reminder`, `from`, `subject`, `message` | ✅ Aligned |
| **send_invite_from_template** | One-shot: create from template + send invite | We do two steps: create then invite (same outcome) | ✅ Aligned |
| **get_document** | Get document/group with invite/field info | We use webhooks for status; optional polling via `getDocumentStatus()` in signnow.ts | ✅ Doc status available |
| **get_invite_status** | Invite status / steps | We rely on webhooks for status; no polling in app | ✅ By design |
| **get_document_download_link** | Download link for document/group | We use `downloadDocument()` (buffer) then upload to Supabase; download API returns signed URL from Storage | ✅ Aligned (we store PDFs ourselves) |
| **get_signing_link** | Signing link for signers | We use email invites; signers get link from SignNow email | ✅ By design |
| **update_document_fields** | Prefill fields on document | We pass `field_values` in create step (`buildFieldValues` in document-service) | ✅ Aligned |
| **list_documents** | List documents/groups | We list via our DB (`documents` table + filters), not SignNow list API | ✅ By design (single source of truth) |
| **create_embedded_*** | Embedded signing/sending/editor in iframe | We use email invites only; no embedded UX in app | ✅ Not used (per docs) |

**Void:** MCP does not expose a “void” tool. We void via `voidDocument()` in `lib/integrations/signnow.ts` → `PUT /v2/document/fieldinvitecancel` with `document_id`. Used on resend (void old doc) and on send failure (cleanup). ✅ Implemented in app.

---

## App flows vs docs

### Templates

- **Doc:** “SignNow template – Dropdown from `/api/signnow/templates`.”
- **App:** `GET /api/signnow/templates` → `getTemplates()` (SignNow `GET /v2/templates`), returns `{ id, name }`. Settings document-template modal fetches this for the dropdown. ✅

### Send document (recruit or person)

- **Doc:** Create from template, resolve signers (recruit/person, manager, HR from template config), send invites (parallel, order 1), set expiration/reminder, store document in DB.
- **App:** `sendDocument()` in document-service: `getTemplateConfigWithValidation` → `resolveSigners` → `createDocumentWithMultipleSigners` (field_invites, field_values) → `createDocument` (DB) → `sendMultipleInvites` (expiration_days, reminder, subject, message). On invite failure we delete DB doc and void in SignNow. ✅

### Resend (expired only)

- **Doc:** Void old document in SignNow, create new from same template and signers, send new invites; old row voided, new row pending.
- **App:** `resendDocument()`: validations (expired, not signed/voided) → `voidSignNowDocument` → `voidDocument` (DB) → `sendDocument()`. ✅

### Webhooks

- **Doc:** `document.open`, `document.fieldinvite.signed`, `invite.expired`, `document.complete`. Verify with SIGNNOW_WEBHOOK_SECRET (HMAC-SHA256). Return 200 always.
- **App:** `app/api/webhooks/signnow/route.ts` handles those four events; verifies `x-signnow-signature` when secret set; returns 200; on `document.complete` downloads PDF and uploads to Supabase Storage. ✅

### Download

- **Doc:** Signed PDFs in Supabase Storage; download API returns short-lived signed URL.
- **App:** Webhook stores `storagePath` on document; download endpoint uses it to generate signed URL from Storage. ✅

### Permissions

- **Doc:** canSendDocumentToRecruit, canSendDocumentToPerson, canViewDocument, canManageTemplates.
- **App:** Implemented in `lib/auth/visibility-rules.ts` and used by send-document, documents list, resend, and document-templates APIs. ✅

---

## Schema and document types

- **DB:** `documents` (recruit_id/person_id, document_type, signnow_document_id, signnow_template_id, status, total_signers, signed_count, expires_at, storage_path, etc.), `document_templates` (document_type, display_name, signnow_template_id, require_recruit/manager/hr, expiration_days, reminder_frequency_days, is_active). ✅ Matches doc and Tech Plan.
- **Document types (Settings):** rep_agreement, tax_forms, onboarding_checklist, offer_letter (DOCUMENT_TYPES in SettingsDocumentTemplatesSection). Seed in 0005_documents_and_templates.sql matches. ✅
- **DocumentType enum:** Also includes `leadership_agreement`; not in Settings DOCUMENT_TYPES list, so it can’t be configured in UI. Optional: add to Settings or remove from enum for consistency.

---

## Minor fixes / optional improvements

1. **buildInviteOptions:** Used to check `documentType === "employment_agreement"` for subject/message; app uses `rep_agreement`. Fixed to use `rep_agreement` so Rep Agreement gets the intended subject/message.
2. **Webhook:** We don’t handle `document.decline` or `document.cancel`. If SignNow sends them, we could set status to voided/declined; currently we only log in `default`. Optional for a later iteration.
3. **leadership_agreement:** Either add to Settings DOCUMENT_TYPES (and seed) or remove from DocumentType enum so UI and enum match.

---

## Summary

- **MCP capabilities:** All MCP tools that map to our flows (list templates, create from template, send invite, get document, download, update fields) are covered by our implementation. Embedded and list_documents are intentionally different (email-only invites, DB as source of truth).
- **Docs:** Architecture, send/resend, webhooks, download, permissions, and template configuration match `docs/signnow-document-management.md` and the Tech Plan.
- **Code fix applied:** `employment_agreement` → `rep_agreement` in buildInviteOptions for correct invite subject/message for Rep Agreement.
