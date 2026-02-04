# Recruiting Pipeline (Kanban)

This doc answers: **Where can we configure the kanban cards?**

## Where pipeline and cards are configured (code-only)

There is **no Settings UI** for the recruiting pipeline. All column and card configuration is in code.

**Single source of truth:** [components/recruiting/recruiting-kanban.tsx](../components/recruiting/recruiting-kanban.tsx)

- **Columns:** `STATUS_COLUMNS` (near the top of the file) — one entry per column: `status`, `label`, `icon`. Example: `{ status: "agreement_sent", label: "Agreement Sent", icon: Send }`. To add/remove/rename columns or change labels/icons, edit this array.
- **Card content:** `RecruitCard` component in the same file — name, role, office, priority badge, source badge, “stuck” bar, recruiter avatar. To change what appears on each card or the layout, edit `RecruitCard`.
- **Badge colors:** `PRIORITY_COLORS` and `SOURCE_COLORS` in the same file — maps used for priority and source badges on cards.

**List view:** [components/recruiting/recruiting-table.tsx](../components/recruiting/recruiting-table.tsx) — status options and display are defined there; keep in sync with kanban statuses if you change pipeline stages.

## Agreement Sent / Agreement Signed (no manual move)

- **Agreement Sent** is set only when a rep agreement is actually sent (Send Rep Agreement flow). Dragging to “Agreement Sent” or selecting it in the status dropdown shows a prompt: “Do you want to send this recruit a rep agreement?” — choosing Send opens the Send Document modal.
- **Agreement Signed** is set only by the SignNow webhook when the rep agreement is fully signed. Dragging to “Agreement Signed” or selecting it shows a message that it’s automatic. **Admins** (MANAGE_SETTINGS) can use **Override agreement status** to set it manually with dates and optional PDF upload.

See [signnow-document-management.md](signnow-document-management.md) for document sending and webhooks.
