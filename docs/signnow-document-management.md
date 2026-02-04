# SignNow Document Management

This guide covers the SignNow document signing and tracking system for recruits and employees: sending documents, tracking status, handling expired documents, and configuring templates.

---

## API reference (for developers and AI agents)

**Resources for agents:** See **docs/signnow-integration-resources.md** for MCPs (SignNow + SignNow API Helper), Postman collection, and other docs to use when building SignNow integrations.

**Use the official SignNow API Postman collection** when implementing or debugging SignNow integration:

- **File:** `SignNow API.postman_collection.json` (project root)
- **What it is:** The full SignNow API docs exported as a Postman collection (endpoints, auth, request/response shapes).
- **When to use it:** To confirm correct endpoints (e.g. `GET /user/folder` + `GET /folder/{{id}}` for listing templates, `POST /oauth2/token` for auth), response formats, and optional parameters. The collection does **not** include a standalone `GET /v2/templates`; template listing in this app may use a folder-based fallback per the collection.

Any future agent or developer working on SignNow should open this file (or import it into Postman) before changing `lib/integrations/signnow.ts` or related APIs.

**Endpoint audit:** See **docs/signnow-api-audit.md** for a table of every SignNow endpoint the app uses and how it maps to the Postman collection (including v2 vs legacy paths and webhook behavior).

---

## User guide

### How to send documents

**To a recruit (Rep Agreement):**

1. Go to **Recruiting** → **Pipeline**.
2. Open a recruit (click the card or row).
3. In the recruit detail modal, find the **Documents** section.
4. Click **Send Rep Agreement**.
5. Review the pre-filled summary (name, email, office, role, template, signers, expiration).
6. Click **Send**. All signers (recruit, manager, HR—based on template config) receive email invites at once (parallel signing).
7. A success toast appears and the modal refreshes; the new document shows in the list with status **Pending**.

**To an employee (any document type):**

1. Go to **People** and open a person.
2. Open the **Documents** tab.
3. Click **Send Document** in the header.
4. Choose the document type (e.g. Tax Forms, Onboarding Checklist, Offer Letter).
5. Review the summary and click **Send**.

**Preview before send:**

- In the send-document modal you can click **Preview** to generate the document (with pre-filled fields) and open it in a new tab as a PDF. No invites are sent yet. If it looks good, click **Send** to send it to signers; the same document is used. If you close the modal without sending, the preview document is voided in SignNow so it doesn’t stay as a draft.

**Notes:**

- The entity (recruit or person) must have a valid email.
- If the template is not configured for that document type, you’ll see an error; ask an admin to configure it in Settings.

---

### How to track document status

**In the recruit modal or person Documents tab:**

- Each document shows:
  - **Type** (e.g. Rep Agreement, Tax Forms).
  - **Status badge**: Pending (yellow), Viewed (blue), Partially Signed (orange), Signed (green), Expired (red), Voided (gray).
  - **Sent** and **Signed** dates when available.
  - **Expiration** date.
- For multi-signer documents, a **progress bar** and **signer list** show how many have signed (e.g. 2 of 3).

**Actions:**

- **View** – Opens the document in SignNow (if still in progress) or via signed URL (if signed).
- **Download** – For signed documents, generates a temporary link to download the PDF from Supabase Storage.
- **Resend** – For **expired** documents only; voids the old document and sends a new one to the same signers.

Status updates (viewed, partially signed, signed, expired) come from SignNow webhooks and appear after refresh or when the list is refetched.

---

### How to handle expired documents

**Expired Documents banner (recruiting):**

- If any recruits in your scope have expired documents, a **red alert banner** appears at the top of the recruiting view.
- It lists names (e.g. “Documents expired for: Jane Doe, John Smith”).
- Click **Review** to apply the “Expired Documents” filter so you only see those recruits.

**Filter:**

- On the recruiting pipeline, use the **Expired Documents** checkbox to show only recruits who have at least one expired document.

**Resending:**

- Open the recruit (or person) and find the expired document in the Documents list.
- Click **Resend**. The system voids the old document in SignNow, creates a new one with the same template and signers, and sends new invites. The old row shows **Voided**; the new one shows **Pending**.

---

## Admin guide

### How to configure templates

Only users with **Manage Settings** (e.g. Admin) can configure document templates.

1. Go to **Settings** → **Organization**.
2. Open the **Documents** tab.
3. You’ll see the four document types: **Rep Agreement**, **Tax Forms**, **Onboarding Checklist**, **Offer Letter**.
4. For each type you can:
   - **Configure** – Open the configuration modal.
   - **Edit** – Change an existing configuration.
   - **Delete** – Deactivate the template (it will no longer be available for sending).

**Configuration modal:**

- **Display name** – Label shown in the app (e.g. “Representative Agreement”).
- **SignNow template** – Dropdown of templates from your SignNow account (from `/api/signnow/templates`). Pick the template that matches this document type.
- **Signers:**
  - **Require Recruit/Employee** – Primary signer (recruit or person).
  - **Require Manager** – Manager must sign (uses recruit’s target manager or person’s reports-to).
  - **Require HR** – An active user with HR (or Human Resources) role must sign.
- **Expiration (days)** – e.g. 30. SignNow will expire the invite after this many days.
- **Reminder frequency (days)** – e.g. 3 or 7. SignNow sends reminder emails on this interval until signed or expired.
- **Description** (optional) – Internal note.

After saving, the template is used when users send that document type. Config is cached for about an hour; edits take effect after cache expiry or deploy.

**SignNow template fields (pre-fill):**

When we create a document from a template, we send **field values** to SignNow so fillable fields in the template can be pre-filled (e.g. name, email, office, role). The field **names** in your SignNow template must match the names below, or those fields will not be filled.

| Field name we send | Description |
|--------------------|-------------|
| `name` | Full name (first + last) of recruit or person |
| `email` | Email of recruit or person |
| `office` | Office name (target office for recruit, current office for person) |
| `role` | Role name (target role for recruit, current role for person) |
| `pay_plan` | Pay plan name (recruits only; empty for people) |
| `manager` | Manager full name (person’s reports-to; empty for recruits) |
| `recruiter_name` | Recruiter full name (recruits only; empty for people) |
| `recruit_name` | Same as `name` (for recruit flows) |
| `recruit_email` | Same as `email` (for recruit flows) |
| `target_office` | Same as `office` (for recruits) |
| `target_role` | Same as `role` (for recruits) |
| `target_pay_plan` | Same as `pay_plan` (for recruits) |

In SignNow, when you add text/field elements to the template, set the field **name** (or prefill key, per SignNow’s UI) to one of the names above. If your template uses different names, either rename them in SignNow to match, or ask a developer to add those names in `buildFieldValues` in `lib/services/document-service.ts`. Unknown field names are ignored by SignNow; they do not cause the request to fail.

**Note:** We create documents via `POST /template/{id}/copy` with **document_name only**, then call **Prefill smart fields** (`POST /document/{id}/integration/object/smartfields`) with the field values below. Your SignNow template must have **smart fields** whose names match the names we send; otherwise pre-fill is skipped (invite still sends). See **Smart fields and pre-fill** below.

---

### Smart fields and pre-fill (optional)

SignNow has two field concepts that affect templates and invites:

| Concept | What it is | Do we need it? |
|--------|------------|----------------|
| **Fillable fields** | Fields on the template assigned to **roles** (e.g. “Signer 1”, “Signer 2”). Used for “Invite to Sign (with fields)”. The invite API may expect **role_id** from the document when the template has these. | Maybe. If your template has role-based fillable fields and the **invite** fails (e.g. “role_id required”), you may need to either (a) use a template **without** predefined roles (free-form signing), or (b) add code to GET the document’s roles after copy and send invite with **role_id** in the body (see Postman “Send a document for signing with predefined fillable fields”). |
| **Smart fields** | Template placeholders you add via **Add smart fields to template** (POST `/document/{template_id}/integration_objects`). You can then **Prefill smart fields** on a document (POST `/document/{document_id}/integration/object/smartfields` with `data: [{ field_name: value }, ...]`). | Optional. Use smart fields if you want **pre-filled text** (name, email, office, role, etc.) in the PDF. Our app has `buildFieldValues()` with names like `name`, `email`, `recruit_name`, `target_office`. We don’t currently call the prefill API after creating the document; adding that step would require the template to have smart fields whose names match what we send. |

**Summary**

- **Sending works without smart fields.** You do **not** need to create smart fields for the basic flow (create from template → send invite). If the invite fails, the real error (now surfaced in the UI) will tell you if SignNow expects something else (e.g. `role_id`, or a different invite body).
- **Pre-filling text (name, email, office, etc.)** – We call **Prefill smart fields** (`POST /document/{document_id}/integration/object/smartfields`) after creating the document (and before sending invites). Add **smart fields** to your template in SignNow with names that match the table above (e.g. `name`, `email`, `recruit_name`, `target_office`). If the template has no matching smart fields, prefill may fail; we log and continue so the invite still sends.

**SignNow Quickstart alignment (role-based invite):** SignNow’s “Send a document for signature to one recipient” flow is: (0) Upload document, (1) Add fields and assign **roles** to the document, (2) **GET document** to fetch role objects, then **send invite with role_id** (role ID or role name from the document). Our app does: create from template (copy) → try v2 invite with `invites` (email, role, order). If v2 returns 400/422, we **GET document roles** (`getDocumentRoles`), map signers to roles by order, and retry with the **legacy** invite endpoint `POST /document/{id}/invite` and body `to: [{ email, role, role_id, order, reminder, expiration_days }]`, so templates with predefined roles work without changing the template.

---

## Developer guide

### Architecture overview

- **Database:** `documents` (polymorphic: `recruitId` or `personId`), `document_templates` (per document type). See Tech Plan for schema.
- **Backend:** `document-service.ts` (send, resend, getExpiredDocuments), `template-service.ts` (config, signer resolution, SignNow template list with caching), `document-helpers.ts` (CRUD and status updates).
- **APIs:** Document CRUD and filters, send-document for recruits/people, document-templates CRUD, download (signed URL), resend, webhook.
- **SignNow:** Create document from template, send invites (parallel), void, download PDF. Webhooks: `document.open`, `document.fieldinvite.signed`, `invite.expired`, `document.complete`.
- **Storage:** Signed PDFs stored in Supabase Storage (`agreements` bucket), paths like `recruit-{id}/` or `person-{id}/`. Download API generates short-lived signed URLs.
- **Permissions:** `canSendDocumentToRecruit`, `canSendDocumentToPerson`, `canViewDocument`, `canManageTemplates` in `visibility-rules.ts`; recruiters for own recruits, managers for team, office managers for office, admins for all.

### Adding new document types

1. **Database:** Add a new row to `document_templates` (or seed migration) with a new `document_type` (e.g. `policy_acknowledgment`), `display_name`, and optional `description`. Leave `signnow_template_id` null until configured.
2. **Types:** Add the new value to the `DocumentType` enum in `types/documents.ts` (e.g. `policy_acknowledgment = "policy_acknowledgment"`).
3. **UI:** Document type will appear in Settings → Organization → Documents and in send flows that list types (e.g. person “Send Document”). No code change needed if the send modal and list already use the enum or API list.
4. **Config:** Admins configure the new type in Settings with SignNow template and signer/expiration/reminder settings.

### Webhook setup

1. In **SignNow** (dashboard), register a webhook URL:  
   `https://<your-production-domain>/api/webhooks/signnow`
2. Set **SIGNNOW_WEBHOOK_SECRET** in Vercel (or your host) to the secret SignNow gives you. The handler verifies the payload with HMAC-SHA256 and ignores invalid requests.
3. Ensure the route is reachable (no auth; SignNow calls it). The handler always returns 200 to avoid retries; errors are logged server-side.
4. Events used: `document.open` (viewed), `document.fieldinvite.signed` (increment signed count, set partially_signed/signed), `invite.expired` (expired), `document.complete` (download PDF, upload to Storage, set signed and storage path).

### Troubleshooting

| Issue | What to check |
|-------|----------------|
| “Document template not configured” | Settings → Organization → Documents: ensure that document type has a SignNow template and is active. |
| “Entity is missing a valid email” | Recruit or person record has no email; add one. |
| “manager is required but entity has no manager” | Template requires manager; set recruit’s target manager or person’s reports-to. |
| “HR signer is required but no active HR person” | Template requires HR; ensure a user has HR (or Human Resources) role and is active, with email. |
| Document stays “Pending” after signing | Webhook may not be reaching your app: check SignNow webhook URL, firewall, and logs for `/api/webhooks/signnow`. |
| Download fails or no PDF | After `document.complete`, PDF is uploaded to Supabase. Check Storage bucket and RLS; ensure `storagePath` is set and download API uses correct bucket/path. |
| “relation documents does not exist” | Run migrations: `npm run db:migrate` (and for production, run against production DB with production `DATABASE_URL`). |

---

## Related docs

- **Go-live checklist:** `docs/signnow-go-live.md`
- **Environment variables:** `docs/vercel-environment-variables.md` (SignNow and webhook)
- **MCP vs app (verification):** `docs/signnow-mcp-vs-app.md` — comparison of SignNow MCP tools and app implementation
- **Supabase Storage (agreements):** `docs/supabase-storage-agreements.md` (if present)
