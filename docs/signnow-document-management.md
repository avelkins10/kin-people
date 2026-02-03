# SignNow Document Management

This guide covers the SignNow document signing and tracking system for recruits and employees: sending documents, tracking status, handling expired documents, and configuring templates.

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
