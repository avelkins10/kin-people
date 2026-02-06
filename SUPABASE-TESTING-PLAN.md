# Supabase Migration Testing Plan

This document captures the testing plan for validating the Neon → Supabase PostgreSQL migration. Use it as a runbook and checklist.

---

## Observations

The application has been successfully migrated from Neon to Supabase PostgreSQL. The database connection now uses `postgres-js` driver instead of `@neondatabase/serverless`. All configuration files (`lib/db/index.ts`, `lib/db/migrate.ts`, `package.json`, `.env.example`) have been updated with Supabase credentials and dependencies. The application uses Clerk for authentication, Drizzle ORM for database operations, and includes complex business logic for commission calculations, recruiting workflows, and people management across 14 database tables.

---

## Prerequisites

- **`.env`** file with Supabase credentials (copy from `.env.example`). Required for:
  - `npm run db:migrate`
  - `npm run db:studio`
  - `npm run dev`
- **DATABASE_URL** format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

---

## Approach

The testing plan focuses on validating the Supabase integration across four critical areas: dependency installation, database migration verification, database connectivity through Drizzle Studio, and comprehensive application functionality testing. Testing progresses from infrastructure validation to feature-level verification.

---

## Implementation Steps

### 1. Install Dependencies and Verify Package Configuration

**Commands:**
\`\`\`bash
npm install
\`\`\`

**Verification:**
- [ ] `@supabase/supabase-js@^2.39.0` is installed in `node_modules`
- [ ] `@supabase/ssr@^0.1.0` is installed in `node_modules`
- [ ] `postgres@^3.4.3` is installed in `node_modules`
- [ ] `@neondatabase/serverless` is **not** present in `node_modules`
- [ ] `package-lock.json` has no Neon dependencies (or only as optional/peer of other packages)

**Expected outcome:** Clean installation with all Supabase packages present and no Neon packages in use.

---

### 2. Verify Database Migration Script

**Commands:**
\`\`\`bash
npm run db:migrate
\`\`\`

**Validation:**
- [ ] Script connects to Supabase database successfully
- [ ] Console shows "Running migrations..." and "Migrations completed successfully"
- [ ] No connection errors or timeouts
- [ ] Migration files in `drizzle/` are applied to Supabase

**Troubleshooting:**
- If connection fails: verify `DATABASE_URL` in `.env` matches Supabase format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
- Ensure Supabase project is active
- Check firewall/network if timeout occurs

---

### 3. Verify Drizzle Studio Connection

**Commands:**
\`\`\`bash
npm run db:studio
\`\`\`

**Validation:**
- [ ] Studio opens at `http://localhost:4983` (or configured port)
- [ ] All 14 tables visible: `people`, `roles`, `offices`, `teams`, `pay_plans`, `commission_rules`, `recruits`, `deals`, `commissions`, `person_history`, `person_pay_plans`, `person_teams`, `org_snapshots`, `activity_log`
- [ ] Browse each table; data present and matches expectations
- [ ] Table relationships and foreign keys intact
- [ ] Indexes and constraints configured

**Expected outcome:** Full schema visible with all migrated data accessible.

---

### 4. Test Application Startup and Authentication

**Commands:**
\`\`\`bash
npm run dev
\`\`\`

**Authentication:**
- [ ] Navigate to `http://localhost:3000`
- [ ] Unauthenticated users redirect to `app/(auth)/login/page.tsx`
- [ ] Login with Clerk credentials succeeds
- [ ] `lib/auth/get-current-user.ts` queries Supabase and matches Clerk `authUserId` to `people.authUserId`
- [ ] `/api/auth/me` returns user data with role and permissions
- [ ] `middleware.ts` protects routes correctly

**Expected outcome:** Successful auth flow with user data from Supabase.

---

### 5. Test People Management Features

**API routes (`app/api/people/`):**
- [ ] GET `/api/people` — fetch all people with role filtering
- [ ] GET `/api/people/[id]` — individual person details
- [ ] POST `/api/people/[id]/change-role`
- [ ] POST `/api/people/[id]/change-manager`
- [ ] POST `/api/people/[id]/change-office`
- [ ] POST `/api/people/[id]/change-pay-plan`
- [ ] POST `/api/people/[id]/add-to-team`
- [ ] POST `/api/people/[id]/terminate`

**UI (`app/(app)/people/`):**
- [ ] `/people` — list loads with filters (`components/people/people-filters.tsx`)
- [ ] Person detail page (`app/(app)/people/[id]/page.tsx`) — overview, timeline, deals, commissions, recruits tabs
- [ ] Action menu (`components/people/person-action-menu.tsx`) — modals for change role, manager, office, pay plan, add to team, terminate

**Database:**
- [ ] Changes persisted in `people`
- [ ] `person_history` records changes
- [ ] `person_teams` and `person_pay_plans` junction tables update correctly

---

### 6. Test Recruiting Workflow

**API routes (`app/api/recruits/`):**
- [ ] GET `/api/recruits` — list with filtering
- [ ] POST `/api/recruits` — create recruit
- [ ] GET `/api/recruits/[id]`
- [ ] PUT `/api/recruits/[id]`
- [ ] POST `/api/recruits/[id]/update-status`
- [ ] POST `/api/recruits/[id]/send-agreement`
- [ ] POST `/api/recruits/[id]/convert-to-person`
- [ ] GET `/api/recruits/[id]/history`

**UI (`app/(app)/recruiting/`):**
- [ ] `/recruiting` — Kanban (`components/recruiting/recruiting-kanban.tsx`) and table view
- [ ] Create recruit (`components/recruiting/modals/add-recruit-modal.tsx`)
- [ ] Update status, send agreement, convert to person

**Database:**
- [ ] `recruits` and `recruit_history` update; converted recruits create proper `people` records

---

### 7. Test Deal Management and Commission Calculations

**API routes (`app/api/deals/`):**
- [ ] GET `/api/deals` — filters (office, status, date, setter, closer)
- [ ] POST `/api/deals` — create deal
- [ ] GET `/api/deals/[id]`, PUT `/api/deals/[id]`

**Commission logic (`lib/services/commission-calculator.ts`):**
- [ ] Self-gen deal (setter = closer) — single commission
- [ ] Split deal — setter and closer commissions
- [ ] Leadership overrides from `reports_to` chain
- [ ] Recruiting overrides from `recruited_by` chain
- [ ] Amounts match `commission_rules`; `org_snapshots` at deal close date

**UI (`app/(app)/deals/`):**
- [ ] `/deals` — filters, create deal modal, table, deal details with setter/closer/commissions

**Database:**
- [ ] `deals`, `commissions`, `commission_history`, `org_snapshots` correct

---

### 8. Test Commission Management

**API routes (`app/api/commissions/`):**
- [ ] GET `/api/commissions` — tabs: my-deals, overrides, team
- [ ] GET `/api/commissions/[id]`
- [ ] POST `/api/commissions/[id]/update-status`

**UI (`app/(app)/commissions/`):**
- [ ] Tabs, filters, summary cards, table, status dropdown

**Visibility (`lib/auth/visibility-rules.ts`):**
- [ ] Sales Rep: own commissions only (My Deals)
- [ ] Team Lead: team commissions
- [ ] Area Director: office-wide
- [ ] Admin: all commissions

---

### 9. Test Org Chart

**API:** GET `/api/org-chart`

**UI (`app/(app)/org-chart/`):**
- [ ] Tree view, list view, controls, quick actions on nodes

**Database:** `people.reports_to_id` and `org_snapshots` render correctly.

---

### 10. Test Settings and Configuration

**API routes:**
- [ ] GET/POST `/api/pay-plans`, PUT `/api/pay-plans/[id]`
- [ ] GET/POST `/api/commission-rules`, PUT `/api/commission-rules/[id]`
- [ ] GET `/api/offices`, `/api/roles`, `/api/teams`

**UI (`app/(app)/settings/`):**
- [ ] Pay plans tab and modal; commission rules tab and modal

**Database:** `pay_plans`, `commission_rules`, `offices`, `roles`, `teams` accessible and correct.

---

### 11. Test Dashboard and Widgets

**UI (`app/(app)/dashboard/`):**
- [ ] Recruiting pipeline widget
- [ ] Team performance widget
- [ ] Recent deals widget  
All query Supabase successfully.

---

### 12. Test Webhook Endpoints

- [ ] POST `/api/webhooks/quickbase` — processes and stores in Supabase
- [ ] POST `/api/webhooks/signnow` — processes and stores
- [ ] Error handling for invalid payloads

---

### 13. Performance and Connection Pool Testing

- [ ] Connection pool usage under load
- [ ] `postgres` client manages connections; no leaks or timeouts
- [ ] Concurrent API requests succeed
- [ ] Query response times acceptable (commission calc, org chart)

---

### 14. Error Handling and Edge Cases

- [ ] Invalid `DATABASE_URL` in `.env` — graceful error
- [ ] Network interruption during query — no crash
- [ ] Malformed API requests — proper error response
- [ ] Missing required fields — handled
- [ ] Concurrent updates — handled
- [ ] Large dataset queries — pagination/limits work

---

## Testing Checklist Summary

### Infrastructure
- [ ] Dependencies installed successfully
- [ ] No Neon packages in use
- [ ] Database migration runs without errors
- [ ] Drizzle Studio connects and shows all 14 tables
- [ ] Application starts on dev server

### Authentication
- [ ] Login redirects work
- [ ] Clerk auth succeeds
- [ ] `/api/auth/me` returns user from Supabase
- [ ] Middleware protects routes

### People Management
- [ ] People list and filters; person details; change role, manager, office, pay plan; add to team; terminate; history tracked

### Recruiting
- [ ] Recruit list (Kanban/table); create; update status; send agreement; convert to person; history

### Deals & Commissions
- [ ] Deal list and filters; create deal; self-gen and split commissions; leadership/recruiting overrides; org snapshots

### Commission Management
- [ ] Tabs, filters, summary cards, status updates; visibility rules

### Org Chart
- [ ] Tree/list view; quick actions

### Settings
- [ ] Pay plans and commission rules CRUD; offices, roles, teams load

### Dashboard
- [ ] Recruiting pipeline, team performance, recent deals widgets

### Webhooks
- [ ] QuickBase and SignNow webhooks process and store data

### Performance
- [ ] Connection pooling under load; no leaks; acceptable response times

### Error Handling
- [ ] Invalid credentials, network errors, malformed requests, concurrent updates handled

---

## Database Connection Diagram

\`\`\`mermaid
sequenceDiagram
    participant App as Next.js Application
    participant DB as lib/db/index.ts
    participant PG as postgres-js Client
    participant SB as Supabase PostgreSQL
    participant Drizzle as Drizzle ORM

    App->>DB: Import db instance
    DB->>PG: Create postgres client
    PG->>SB: Connect to DATABASE_URL
    SB-->>PG: Connection established
    DB->>Drizzle: Initialize drizzle(client, schema)
    Drizzle-->>DB: Return db instance
    DB-->>App: Export db instance

    App->>Drizzle: Execute query (db.select())
    Drizzle->>PG: Translate to SQL
    PG->>SB: Execute SQL query
    SB-->>PG: Return results
    PG-->>Drizzle: Return data
    Drizzle-->>App: Return typed results
\`\`\`
