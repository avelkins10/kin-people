# Kin People — Designer Brief for Magic Patterns

A structured summary of the Kin People codebase for frontend design collaboration. Use this with Magic Patterns or any design tool to align UI with existing data, APIs, roles, and patterns.

---

## 1. DATA MODELS

Kin People uses **Drizzle ORM** with **PostgreSQL** (Neon/Supabase). All schema lives in `lib/db/schema/`.

### Core Tables

| Table | Purpose |
|-------|--------|
| **people** | Sales reps, managers, team members. Links to role, office, manager (`reports_to`), recruiter (`recruited_by`). Has `status` (onboarding, active, inactive, terminated) and optional `setter_tier` (Rookie, Veteran, Team Lead). |
| **roles** | Job titles with hierarchy `level` (1 = lowest). Names: Admin, Regional Manager, Office Manager, Area Director, Team Lead, Sales Rep. |
| **offices** | Locations with `name`, `region`, `states[]`, `address`, `isActive`. |
| **teams** | Groups within an office; have `team_lead_id` → people. |
| **recruits** | Pipeline candidates (not yet people). Have `status`, `recruiter_id`, target office/team/role/pay_plan, agreement fields, `converted_to_person_id`. |
| **deals** | Sales deals with **Setter/Closer model**: `setter_id`, `closer_id`, `is_self_gen` (same person). Fields: `deal_type` (solar, hvac, roofing), `deal_value`, `system_size_kw`, `ppw`, dates, `status`. |
| **commissions** | Calculated commission rows per deal/person. `commission_type` (setter, closer, self_gen, override_*), `amount`, `status` (pending, approved, paid, held, void). |
| **commission_rules** | Rules within pay plans: rule_type (base_commission, setter_commission, closer_commission, self_gen_commission, override, recruiting_bonus, draw), calc_method (flat_per_kw, percentage_of_deal, flat_fee). |
| **pay_plans** | Named compensation plans. People get pay plans via **person_pay_plans** (effective/end dates). |

### Junction & History Tables

| Table | Purpose |
|-------|--------|
| **person_teams** | Person ↔ team membership; `role_in_team` (member, lead, co-lead), effective/end dates. |
| **person_pay_plans** | Person ↔ pay plan with effective/end dates. |
| **person_history** | Audit of person changes: role_change, status_change, office_change, reports_to_change, pay_plan_change, team_join/leave, hired, terminated, setter_tier_change. |
| **recruit_history** | Status changes for recruits (previous_status, new_status, notes). |
| **commission_history** | Status changes for commissions. |
| **org_snapshots** | Point-in-time org state per person (for commission calc). |
| **activity_log** | Entity/action audit (person, deal, commission, recruit, office, team, etc.). |

### Key Relationships

- **people** → role, office, reports_to (person), recruited_by (person), team membership via person_teams, pay plan via person_pay_plans.
- **recruits** → recruiter (person), target_office, target_team, target_reports_to (person), target_role, target_pay_plan; on convert → **people** (and recruit gets `converted_to_person_id`).
- **deals** → setter (person), closer (person), office; **commissions** → deal, person, commission_rule, pay_plan.
- **teams** → office, team_lead (person).

### Important Enums / Values

- **Person status:** `onboarding` \| `active` \| `inactive` \| `terminated`
- **Person setter_tier:** `Rookie` \| `Veteran` \| `Team Lead`
- **Recruit status:** `lead` \| `contacted` \| `interviewing` \| `offer_sent` \| `agreement_sent` \| `agreement_signed` \| `onboarding` \| `converted` \| `rejected` \| `dropped`
- **Recruit priority:** `high` \| `medium` \| `low` (nullable)
- **Deal status:** `sold` \| `pending` \| `permitted` \| `scheduled` \| `installed` \| `pto` \| `complete` \| `cancelled`
- **Deal type:** `solar` \| `hvac` \| `roofing`
- **Commission status:** `pending` \| `approved` \| `paid` \| `held` \| `void`

---

## 2. API ENDPOINTS

All routes are **Next.js App Router API routes** (`app/api/...`). No tRPC. Auth is enforced via `withAuth` / `withPermission`; responses are JSON.

### Auth

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/auth/me` | Current user (person + role, office, etc.) or 401 |
| POST | `/api/auth/sync-user` | Syncs Supabase auth user to `people.auth_user_id` |
| POST | `/api/auth/logout` | Logout |

### People

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/people` | List: id, firstName, lastName, name; optional filter `roleLevel=manager` |
| GET | `/api/people/[id]` | Single person (full record) |
| POST | `/api/people/[id]/add-to-team` | Add person to team |
| POST | `/api/people/[id]/change-manager` | Change reports_to |
| POST | `/api/people/[id]/change-office` | Change office |
| POST | `/api/people/[id]/change-pay-plan` | Change pay plan (effective date) |
| POST | `/api/people/[id]/change-role` | Change role |
| POST | `/api/people/[id]/terminate` | Set status terminated, termination date |
| GET | `/api/people/[id]/documents` | List documents for person |
| GET | `/api/people/[id]/documents/download/[path]` | Download document |

### Recruiting

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/recruits` | List with recruiter, targetOffice, targetRole; query: `status`, `recruiterId`, `officeId` |
| POST | `/api/recruits` | Create recruit (firstName, lastName, email, phone, source, priority, target* ids) |
| GET | `/api/recruits/[id]` | Single recruit (with related target office/team/role/pay_plan/reports_to) |
| PUT | `/api/recruits/[id]` | Update recruit |
| POST | `/api/recruits/[id]/update-status` | Change status (writes recruit_history) |
| POST | `/api/recruits/[id]/convert-to-person` | Convert recruit → person (must be `agreement_signed`; body: hireDate) |
| POST | `/api/recruits/[id]/send-agreement` | Send e-sign agreement (SignNow) |
| GET | `/api/recruits/[id]/history` | Recruit status history |
| GET | `/api/recruits/[id]/documents/download/...` | Download recruit document |
| GET | `/api/recruiting/stats` | Recruiting pipeline stats (e.g. counts by status) |

### Deals

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/deals` | List with setter, closer, office; query: officeId, status, dealType, startDate, endDate, setterId, closerId, limit |
| POST | `/api/deals` | Create deal (setterId, closerId, dealType, dealValue, systemSizeKw, ppw, dates, customer*, officeId, status) |
| GET | `/api/deals/[id]` | Single deal |
| PUT | `/api/deals/[id]` | Update deal |
| DELETE | `/api/deals/[id]` | Soft delete (status → cancelled) |
| POST | `/api/deals/[id]/calculate` | Trigger commission calculation for deal |

### Commissions

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/commissions` | List with deal, person, setter, closer, office; query: dateStart, dateEnd, status, dealType, commissionType, tab (my-deals \| team \| overrides) |
| GET | `/api/commissions/[id]` | Single commission |
| PATCH | `/api/commissions/[id]/update-status` | Update commission status (e.g. approved, paid, held, void) |

### Payroll

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/payroll/period` | Pay period info |
| GET | `/api/payroll/summary` | Payroll summary (role-scoped) |
| POST | `/api/payroll/mark-paid` | Mark commissions as paid |
| GET | `/api/payroll/export` | Export for payroll |

### Org & Settings

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/org-chart` | Tree for org chart; query: view=reports_to, office, search |
| GET | `/api/roles` | List roles |
| GET/POST | `/api/roles`, `/api/roles/[id]` | CRUD roles |
| GET | `/api/offices` | List offices |
| GET/POST | `/api/offices`, `/api/offices/[id]` | CRUD offices |
| GET | `/api/teams` | List teams (optional officeId) |
| GET/POST | `/api/teams`, `/api/teams/[id]` | CRUD teams |
| GET | `/api/pay-plans` | List pay plans |
| GET/POST | `/api/pay-plans`, `/api/pay-plans/[id]` | CRUD pay plans |
| GET | `/api/commission-rules` | List rules (optional payPlanId) |
| GET/POST | `/api/commission-rules`, `/api/commission-rules/[id]` | CRUD commission rules |

### Dashboard & Integrations

| Method | Route | Returns |
|--------|-------|--------|
| GET | `/api/dashboard/stats` | Counts: totalPeople, activeRecruits, pendingCommissions, recentDealsCount (role-scoped) |
| GET | `/api/signnow/templates` | SignNow template list for agreements |
| POST | `/api/webhooks/quickbase` | QuickBase webhook handler |
| POST | `/api/webhooks/signnow` | SignNow webhook (agreement signed → update recruit) |

---

## 3. USER ROLES & PERMISSIONS

Roles are stored in **roles** and referenced by **people**. Permissions are defined in code (`lib/permissions/roles.ts`, `lib/permissions/types.ts`) and enforced in API and visibility helpers.

### Roles (by hierarchy)

1. **Admin** — Full access.
2. **Regional Manager** — Region-wide; view all people, approve commissions; no MANAGE_ALL_OFFICES or RUN_PAYROLL.
3. **Office Manager** — Own office; manage office, view office people, approve commissions.
4. **Area Director** — Same permission set as Office Manager in code.
5. **Team Lead** — Own team; manage team, view office/team, create recruits/deals, edit deals; no approve commissions.
6. **Sales Rep** — Own data only; create recruits and deals.

### Permission Enum (summary)

- **Manage:** MANAGE_SETTINGS, MANAGE_ALL_OFFICES, MANAGE_OWN_REGION, MANAGE_OWN_OFFICE, MANAGE_OWN_TEAM  
- **View:** VIEW_ALL_PEOPLE, VIEW_OWN_OFFICE_PEOPLE, VIEW_OWN_TEAM, VIEW_OWN_DATA_ONLY  
- **Actions:** CREATE_RECRUITS, CREATE_DEALS, EDIT_DEALS, DELETE_DEALS, APPROVE_COMMISSIONS, RUN_PAYROLL  

### Visibility (what each role sees)

- **Admin / Regional Manager:** All people, deals, recruits, commissions (no filter).
- **Office Manager:** People and deals in their office; recruits targeting their office; commissions for their office (and “overrides” tab filtered by office).
- **Team Lead:** People/deals in office or reporting to them; recruits targeting their office; commissions for team/office.
- **Sales Rep:** Only own people record, own deals (as setter or closer), own recruits, own commissions. Closers can also see setter commission on the same deal (transparency).

Components like `PermissionGuard` and `RoleGuard` exist in `components/auth/` to hide or gate UI by permission/role.

---

## 4. KEY WORKFLOWS

### Recruiting pipeline

- **Stages (status):**  
  `lead` → `contacted` → `interviewing` → `offer_sent` → `agreement_sent` → `agreement_signed` → `onboarding` → `converted`  
  Terminal: `rejected`, `dropped`.

- **Fields:** Recruiter (person), target office, team, reports_to, role, pay plan; optional priority (high/medium/low), source, last_contact_date. Agreement tracking: SignNow document id, sent/signed timestamps, document URL/path.

- **Convert to person:** Only when status = `agreement_signed`. Creates **people** from recruit + target office/role/team/reports_to/pay_plan, sets hire date, writes person_history, links recruit via `converted_to_person_id` and sets recruit status to `converted`.

- **State:** Status is updated via `POST /api/recruits/[id]/update-status`; each change is recorded in **recruit_history**. No separate state machine file; status values and transitions are the implicit flow.

### Onboarding (people)

- **Person status** `onboarding` = newly hired, not yet “active”. No separate checklist table; onboarding is represented by status and possibly timeline (person_history) showing role/office/pay plan changes.

- After **convert** from recruit, the new person can be given status `onboarding` and later moved to `active` via person update/change-role or status change flows.

### Deal → Commission flow

- Deal has setter + closer (and optional `org_snapshot_id` at close).  
- **Commission calculation** is triggered manually (`POST /api/deals/[id]/calculate`) or on close; it creates **commissions** rows (setter, closer, self_gen, overrides via reports_to and recruited_by chains) using **commission_rules** and **pay_plans**.  
- Commission **status** flow: `pending` → `approved` (optional) → `paid` (payroll); or `held` / `void`.

### Payroll

- Payroll summary and period endpoints; **mark-paid** updates commission statuses; **export** for downstream payroll.

---

## 5. EXISTING UI PATTERNS

### Stack

- **React 18** + **TypeScript**, **Next.js 14** (App Router).
- **Tailwind CSS** (utility-only), **Tailwind v4** with `@tailwindcss/postcss`, `tailwindcss-animate`.
- **Radix-based UI:** Radix Dialog, Dropdown, Label, Select, Tabs, Slot, Avatar, Checkbox (no separate “shadcn” package; components are local in `components/ui/`).
- **Icons:** Lucide React.
- **Charts:** Recharts (mentioned in user rules; confirm usage in dashboard).
- **Drag and drop:** @dnd-kit (core, sortable, utilities) for kanban/sorting.
- **Utilities:** class-variance-authority, clsx, tailwind-merge, date-fns, zod.

### Theming (Tailwind + CSS variables)

- **globals.css** defines semantic tokens: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--info`, `--border`, `--input`, `--ring`, plus chart and sidebar tokens. Colors use **OKLCH**.
- **Light:** Primary blue (#3B82F6), success #10B981, warning #F59E0B, destructive #EF4444.
- **Dark:** `.dark` overrides for slate-style dark theme.
- **Radius:** `--radius: 0.625rem`; variants `sm` … `4xl` in theme.

### Design system docs

- **docs/design-system.md** — Full design system (colors, typography, spacing, components, forms, layout, a11y, dark mode).
- **docs/design-system-quick-reference.md** — Copy-paste snippets for layout, buttons, badges, forms, tables, etc.

### Component layout

- **components/ui/** — Primitives: avatar, badge, button, card, checkbox, dialog, dropdown-menu, empty-state, form-field, input, label, loading-spinner, select, table, tabs, textarea, toast.
- **components/commissions/** — Filters, summary cards, table, status dropdown, tabs.
- **components/dashboard/** — Recent deals, recruiting pipeline, team performance widgets.
- **components/deals/** — Filters, table, create/edit forms, modals, deal detail actions.
- **components/org-chart/** — Tree/list views, node actions, controls.
- **components/people/** — Filters, action menu, overview, commissions, deals, documents, recruits, timeline; modals for add-to-team, change-manager/office/role/pay-plan, terminate.
- **components/recruiting/** — Kanban, table, pipeline stats, alert banner; modals for add recruit, detail, send agreement, convert to person.
- **components/settings/** — Sidebar, overview, commission rules tab, pay plans tab; modals for office, role, team, pay plan, commission rule.
- **components/shared/** — App navigation, user profile.
- **components/auth/** — Permission guard, role guard.

Patterns: page layout with `max-w-7xl`, `px-4 py-8 sm:px-6 lg:px-8`; cards with CardHeader/CardContent/CardFooter; forms with FormField + validation; loading and empty states; toasts for success/error.

---

## 6. BUSINESS CONTEXT

### Industry / product

- **Kin People** supports **solar, HVAC, and roofing** sales orgs (multi-state, multi-office). Replaces Sequifi; focus is org hierarchy, recruiting, commissions, and payroll.

### Terminology

- **Setter** — Rep who sets the appointment/sale (often door-to-door or lead-gen). Tracked on deals as `setter_id`.
- **Closer** — Rep who closes the deal. Tracked as `closer_id`. Same person = “self-gen” deal (`is_self_gen`).
- **Setter tier** — Rookie / Veteran / Team Lead; used in commission rules (e.g. override or rate differences).
- **Override** — Commission for managers/recruiters from their team’s or recruited reps’ deals; calculated via `reports_to` and `recruited_by` chains.
- **Recruiter** — Person who “owns” the recruit in the pipeline (`recruiter_id`). Often same as hiring manager; conversion sets `recruited_by_id` on the new person.
- **PTO** — Permission to operate (solar); deal status `pto` = post-install approval.
- **Deal types** — solar (with system_size_kw, ppw), hvac, roofing.
- **Pay plan** — Compensation plan; commission rules (flat_per_kw, percentage_of_deal, flat_fee) live under pay plans.

### Metrics that matter

- **Pipeline:** Recruit counts by status, time in stage, conversion rate (lead → converted).
- **Sales:** Deals by status, type, office, setter/closer; deal value, system size (solar), ppw.
- **Commissions:** Pending vs approved vs paid; amounts by type (setter, closer, self_gen, overrides); payroll export and mark-paid.
- **Org:** Headcount by office/role/team; org chart depth; turnover (terminations, hire date).
- **Dashboard:** totalPeople, activeRecruits, pendingCommissions, recentDealsCount — all role-scoped.

Use this doc as the single reference for data shapes, API contracts, roles, workflows, and UI patterns when designing in Magic Patterns or elsewhere.
