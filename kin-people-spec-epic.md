# KIN People Platform — Complete Technical Specification

## Project Overview

**Name:** KIN People

**Purpose:** Replace Sequifi with a purpose-built sales rep onboarding, org management, and commission platform for KIN Home — a multi-state solar, HVAC, and roofing company operating in Utah (HQ), Iowa, Ohio, Florida, Missouri, and expanding into California.

**Problem Statement:** Current platform (Sequifi) fails at accurate org hierarchy tracking, which breaks override calculations, recruiting attribution, and manager payouts. Commission logic is inflexible and doesn't match actual pay structures. No historical tracking of promotions, role changes, or org changes.

**Core Value Prop:** Own the org hierarchy as the single source of truth. Track all historical changes (promotions, transfers, pay plan changes). Calculate commissions accurately based on who recruited who and who reports to who at the time of each deal.

---

## Tech Stack (Use These Exactly)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | Next.js 14+ (App Router) | Use server components where possible |
| **Language** | TypeScript | Strict mode enabled |
| **Database** | Neon (Serverless Postgres) | Connection string in env |
| **ORM** | Drizzle ORM | Type-safe, lightweight |
| **Auth** | Clerk | Use @clerk/nextjs |
| **UI Components** | shadcn/ui | Install components as needed |
| **Styling** | Tailwind CSS | Default with shadcn |
| **E-Sign** | SignNow API | REST API integration |
| **File Storage** | Cloudflare R2 | For signed documents |
| **Hosting** | Vercel | Auto-deploy from GitHub |
| **Validation** | Zod | Schema validation for API inputs |

---

## Build Order (Priority Sequence)

### Ticket 1: Project Setup
- Initialize Next.js 14+ project with TypeScript and App Router
- Install and configure Drizzle ORM with Neon connection
- Set up Clerk authentication
- Install shadcn/ui and Tailwind CSS
- Create project folder structure:
  ```
  /app
    /api
    /(auth)
    /(dashboard)
  /components
    /ui (shadcn)
    /shared
  /lib
    /db (drizzle schema, connection)
    /utils
    /validations (zod schemas)
  /types
  ```
- Set up environment variables template (.env.example)
- Create base layout with Clerk auth wrapper

### Ticket 2: Database Schema
- Create Drizzle schema files matching the SQL schema below
- Run migrations to create all tables in Neon
- Create all indexes
- Verify database connection and tables

### Ticket 3: Roles & Offices CRUD
- **API Routes:**
  - GET/POST /api/roles
  - GET/PUT/DELETE /api/roles/[id]
  - PUT /api/roles/reorder
  - GET/POST /api/offices
  - GET/PUT/DELETE /api/offices/[id]
- **UI Pages:**
  - /settings/roles - List, create, edit, reorder roles
  - /settings/offices - List, create, edit offices
- **Features:**
  - Soft delete (is_active = false)
  - Drag-and-drop reorder for roles
  - Form validation with Zod

### Ticket 4: Teams & Pay Plans CRUD
- **API Routes:**
  - GET/POST /api/teams
  - GET/PUT/DELETE /api/teams/[id]
  - GET/POST /api/pay-plans
  - GET/PUT/DELETE /api/pay-plans/[id]
  - GET/POST /api/pay-plans/[id]/rules
  - PUT/DELETE /api/pay-plans/[id]/rules/[ruleId]
- **UI Pages:**
  - /settings/teams - List, create, edit teams
  - /settings/pay-plans - List, create, edit pay plans
  - Pay plan detail page with commission rules management
- **Features:**
  - Add/edit/remove commission rules within pay plans
  - Support all rule types: base_commission, override, recruiting_bonus, draw
  - Support all calc methods: flat_per_kw, percentage_of_deal, flat_fee

### Ticket 5: People CRUD + History
- **API Routes:**
  - GET/POST /api/people
  - GET/PUT/DELETE /api/people/[id]
  - GET /api/people/[id]/history
  - GET /api/people/[id]/timeline
  - POST /api/people/[id]/change-role
  - POST /api/people/[id]/change-office
  - POST /api/people/[id]/change-manager
  - POST /api/people/[id]/change-pay-plan
  - POST /api/people/[id]/terminate
- **UI Pages:**
  - /people - List with filters (status, office, role, team)
  - /people/[id] - Detail page with tabs:
    - Overview (current state)
    - History (timeline of all changes)
    - Teams
    - Pay Plans
- **Features:**
  - Auto-create person_history record on any change
  - Auto-create/update person_pay_plans with effective dates
  - Search and filter people list
  - Show recruited_by and reports_to relationships

### Ticket 6: Org Chart
- **API Routes:**
  - GET /api/org-chart (full tree)
  - GET /api/org-chart/[personId] (subtree from person)
  - GET /api/people/[id]/downline
- **UI Pages:**
  - /org-chart - Full visual org chart
- **Features:**
  - Tree visualization showing reports_to hierarchy
  - Click node to view person detail
  - Expand/collapse branches
  - Show role and office for each person
  - Option to view from any person down

### Ticket 7: Recruiting Pipeline
- **API Routes:**
  - GET/POST /api/recruits
  - GET/PUT/DELETE /api/recruits/[id]
  - POST /api/recruits/[id]/advance-status
  - POST /api/recruits/[id]/reject
  - POST /api/recruits/[id]/convert
  - GET /api/recruits/[id]/history
- **UI Pages:**
  - /recruiting - Pipeline view (kanban by status or list)
  - /recruiting/[id] - Recruit detail page
- **Features:**
  - Status progression: lead → contacted → interviewing → offer_sent → agreement_sent → agreement_signed → onboarding → converted
  - Assign target: office, team, reports_to, role, pay_plan
  - Track recruiter (who's recruiting this person)
  - Create recruit_history on status changes
  - Convert action creates person record with all assignments

### Ticket 8: SignNow Integration
- **API Routes:**
  - POST /api/recruits/[id]/send-agreement
  - POST /api/webhooks/signnow
- **Features:**
  - Create document from SignNow template
  - Pre-fill fields: first_name, last_name, email, role, office, pay_plan, recruiter
  - Send for signature to recruit email
  - Store signnow_document_id on recruit
  - Webhook handler:
    - Verify webhook signature
    - Update agreement_signed_at
    - Store agreement_document_url
    - Update status to 'agreement_signed'
- **Environment Variables:**
  - SIGNNOW_API_KEY
  - SIGNNOW_TEMPLATE_ID
  - SIGNNOW_WEBHOOK_SECRET

### Ticket 9: Deals + Manual Entry
- **API Routes:**
  - GET/POST /api/deals
  - GET/PUT /api/deals/[id]
  - GET /api/deals/[id]/commissions
- **UI Pages:**
  - /deals - List with filters (status, type, rep, office, date range)
  - /deals/[id] - Detail page showing deal info and calculated commissions
  - /deals/new - Manual deal entry form
- **Features:**
  - Support deal types: solar, hvac, roofing
  - Required fields: rep_id, deal_type, deal_value, close_date
  - Solar-specific: system_size_kw, ppw
  - Customer info: name, address, email, phone
  - Status tracking: sold, pending, permitted, scheduled, installed, pto, complete, cancelled

### Ticket 10: Commission Engine
- **API Routes:**
  - POST /api/deals/[id]/calculate-commissions (manual trigger)
  - Auto-trigger on deal close
- **Core Logic (create as lib/commissions/calculate.ts):**
  ```typescript
  async function calculateCommissions(dealId: string) {
    // 1. Get deal with rep info
    // 2. Get or create org_snapshot for rep as of close_date
    // 3. Get rep's pay_plan as of close_date
    // 4. Calculate base commission
    // 5. Walk reports_to chain for overrides
    // 6. Walk recruited_by chain for overrides
    // 7. Create commission records
  }
  ```
- **Org Snapshot Logic:**
  - Capture: role_id, role_name, office_id, office_name, reports_to_id, reports_to_name, recruited_by_id, recruited_by_name, pay_plan_id, pay_plan_name, team_ids, team_names
  - Store in org_snapshots table
  - Reuse existing snapshot if same person + date exists
- **Commission Calculation:**
  - Base: Apply calc_method to deal (flat_per_kw × kW, percentage × value, or flat_fee)
  - Overrides: For each level, walk up chain, get that person's pay plan, find matching override rule, calculate amount
  - Store calc_details JSON with full breakdown
- **Features:**
  - All commissions created with status = 'pending'
  - Link to org_snapshot used for calculation
  - Store commission_rule_id for audit trail

### Ticket 11: Commission Approval Workflow
- **API Routes:**
  - GET /api/commissions (with filters)
  - GET /api/commissions/[id]
  - PUT /api/commissions/[id]
  - POST /api/commissions/[id]/approve
  - POST /api/commissions/[id]/hold
  - POST /api/commissions/[id]/clawback
  - POST /api/commissions/bulk-approve
  - POST /api/commissions/bulk-hold
- **UI Pages:**
  - /commissions - List with tabs: Pending, Approved, Paid, Held
  - /commissions/[id] - Detail with calc breakdown
- **Features:**
  - Filter by: status, person, office, team, date range, deal type
  - Bulk select and approve/hold
  - View calc_details breakdown for any commission
  - Create commission_history on status changes
  - Hold with reason (status_reason field)
  - Clawback for cancelled deals

### Ticket 12: Payroll Export
- **API Routes:**
  - GET /api/payroll/pending
  - GET /api/payroll/summary
  - POST /api/payroll/export
  - POST /api/payroll/mark-paid
- **UI Pages:**
  - /payroll - Current period view
  - /payroll/history - Past payroll runs
- **Features:**
  - Select date range for pay period
  - View all approved commissions in period
  - Summary view aggregated by person
  - Export CSV with columns: person name, email, total amount, breakdown
  - Mark selected commissions as paid (bulk update)
  - Set paid_at timestamp

### Ticket 13: Dashboard
- **API Routes:**
  - GET /api/dashboard/stats
- **UI Pages:**
  - /dashboard - Main landing after login
- **Features:**
  - Key metrics: total people, active recruits, pending commissions, recent deals
  - Recent activity feed
  - Quick links to common actions

### Ticket 14: Settings Hub
- **UI Pages:**
  - /settings - Settings landing page with links to:
    - /settings/roles
    - /settings/offices
    - /settings/teams
    - /settings/pay-plans
    - /settings/integrations (placeholder for future)
- **Features:**
  - Clean navigation between settings sections
  - Breadcrumbs

---

## Out of Scope (Do NOT Build in MVP)

- QuickBase integration (Phase 2)
- Rep self-service portal (Phase 2)
- Reporting dashboards and analytics (Phase 2)
- Knocking tool auto-provisioning (Phase 3)
- Mobile app (Phase 3)
- Advanced analytics and charts (Phase 3)
- Email notifications (Phase 2)
- Audit log UI (Phase 2 - just log to activity_log table for now)

---

## Core Modules (Reference)

### 1. Settings & Configuration
Manage all configurable entities in the system.

**Configurable Entities:**
- **Roles** — Define role names, hierarchy levels, permissions (e.g., Sales Rep, Senior Rep, Team Lead, Manager, Regional Director)
- **Offices** — Locations with region and state assignments
- **Teams** — Flexible groupings within or across offices
- **Pay Plans** — Commission structures with rules
- **System Settings** — Company-wide defaults

**Key Features:**
- Create, edit, deactivate (soft delete) all entities
- Drag-and-drop reordering for roles
- Role-based permissions configuration
- Audit trail for all config changes

### 2. Recruiting Pipeline
Track recruits from first contact through signed agreement to fully onboarded rep.

**Statuses:** `lead` → `contacted` → `interviewing` → `offer_sent` → `agreement_sent` → `agreement_signed` → `onboarding` → `converted` | `rejected` | `dropped`

**Key Flows:**
- Recruiter adds new recruit, assigns target office, team, manager, pay plan, role
- System sends rep agreement via SignNow
- Webhook receives signed confirmation, updates status
- On "onboarding" status, trigger account creation for knocking tools
- On "converted" status, create `people` record with all relationships set

**SignNow Integration:**
- Use SignNow API to create document from template (rep agreement)
- Pre-fill fields: name, email, office, pay plan details, recruiter name, role
- Send for signature
- Register webhook for `document.completed` event
- Store signed document URL

### 3. People & Org Management
Manage all reps, managers, and their relationships with full historical tracking.

**Key Data:**
- `role_id` — configurable role (can change, tracked in history)
- `recruited_by_id` — permanent, never changes
- `reports_to_id` — current manager (can change, tracked in history)
- `office_id` — current office (can change, tracked in history)
- `status` — active, inactive, terminated

**Historical Tracking:**
Every change creates a `person_history` record:
- Role changes (promotions/demotions)
- Pay plan changes
- Office transfers
- Manager (reports_to) changes
- Team membership changes
- Status changes

**Views:**
- Org chart visualization (tree view by reports_to)
- Office roster
- Team roster
- Person timeline (all historical changes)
- Recruiter leaderboard

### 4. Teams
Flexible groupings separate from office hierarchy.

**Features:**
- Teams can be within an office or span multiple offices
- Each team has a lead (optional)
- People can be on multiple teams
- Team membership is tracked historically
- Teams can be temporary (e.g., summer sales push)

### 5. Pay Plans & Commission Rules
Define flexible commission structures.

**Commission Types:**
- `base_commission` — what the rep earns on their own deal
- `override` — what managers/recruiters earn on downline deals
- `recruiting_bonus` — one-time bonus for bringing someone in
- `draw` — advance against future commissions

**Calculation Methods:**
- `flat_per_kw` — $X per kW sold
- `percentage_of_deal` — X% of deal value
- `flat_fee` — fixed dollar amount

**Override Logic:**
- `override_source`: `reports_to` (management chain) or `recruited_by` (recruiting chain)
- `override_level`: how many levels up (1 = direct, 2 = skip-level, etc.)
- Multiple override rules per pay plan supported

**Special Deals:**
- Per-person notes on pay plan assignments
- Conditions JSONB for threshold logic (min kW, PPW floors, etc.)

### 6. Deals & Commission Engine
Sync deals from QuickBase, calculate commissions accurately.

**Deal Sync (from QuickBase):** (PHASE 2 - NOT MVP)
- Webhook or polling based on QB setup
- Pull: rep, customer, system size, PPW, deal value, close date, status, deal type
- Match rep via `quickbase_id`

**Commission Calculation (triggered on deal close):**
1. Get deal details
2. Snapshot org state as of close date (role, reports_to, recruited_by, pay_plan, office, team)
3. Calculate base commission for rep
4. Walk up `reports_to` chain, apply override rules
5. Walk up `recruited_by` chain, apply override rules
6. Create `commissions` records with full calc details stored
7. All calculations reference historical state, not current state

**Commission Statuses:**
- `pending` — calculated, awaiting approval
- `approved` — ready for payroll
- `paid` — included in payroll run
- `held` — manually held
- `clawback` — deal cancelled, commission reversed

### 7. Payroll Export
Generate payroll-ready data for your payroll provider.

**Flow:**
1. Admin selects pay period
2. System pulls all `approved` commissions for that period
3. Aggregates by person
4. Generates CSV/export in required format
5. Marks commissions as `paid` with timestamp

---

## User Roles & Permissions

Permissions are configurable per role. Default structure:

| Permission | Admin | Regional Dir | Office Mgr | Team Lead | Rep |
|------------|-------|--------------|------------|-----------|-----|
| Manage settings/config | ✓ | | | | |
| Manage all offices | ✓ | | | | |
| Manage own region | ✓ | ✓ | | | |
| Manage own office | ✓ | ✓ | ✓ | | |
| Manage own team | ✓ | ✓ | ✓ | ✓ | |
| View all people | ✓ | ✓ | | | |
| View own office people | ✓ | ✓ | ✓ | ✓ | |
| View own team | ✓ | ✓ | ✓ | ✓ | |
| Create recruits | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve commissions | ✓ | ✓ | ✓ | | |
| Run payroll | ✓ | | | | |
| View own data only | | | | | ✓ |

---

## Database Schema

### Drizzle Schema Files Structure
```
/lib/db/
  schema/
    roles.ts
    offices.ts
    teams.ts
    pay-plans.ts
    commission-rules.ts
    people.ts
    person-teams.ts
    person-pay-plans.ts
    person-history.ts
    org-snapshots.ts
    recruits.ts
    recruit-history.ts
    deals.ts
    commissions.ts
    commission-history.ts
    activity-log.ts
    index.ts (exports all)
  index.ts (connection + db instance)
  migrate.ts
```

### SQL Schema (Reference for Drizzle)

```sql
-- =====================
-- CONFIGURATION TABLES
-- =====================

-- Configurable roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL, -- hierarchy level (1 = lowest)
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offices / Locations
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    states TEXT[],
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams (flexible groupings)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    office_id UUID REFERENCES offices(id), -- null if cross-office
    team_lead_id UUID, -- references people(id), added after people table
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pay plan definitions
CREATE TABLE pay_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission rules within a pay plan
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_plan_id UUID REFERENCES pay_plans(id) NOT NULL,
    name VARCHAR(100), -- friendly name for this rule
    rule_type VARCHAR(50) NOT NULL, -- 'base_commission', 'override', 'recruiting_bonus', 'draw'
    calc_method VARCHAR(50) NOT NULL, -- 'flat_per_kw', 'percentage_of_deal', 'flat_fee'
    amount DECIMAL(10,4) NOT NULL, -- the rate ($ or %)
    applies_to_role_id UUID REFERENCES roles(id), -- which role this applies to (for overrides)
    override_level INT, -- 1 = direct, 2 = skip-level, etc.
    override_source VARCHAR(50), -- 'reports_to' or 'recruited_by'
    deal_types TEXT[], -- which deal types this applies to: ['solar', 'hvac', 'roofing'], null = all
    conditions JSONB DEFAULT '{}', -- flexible conditions (min_kw, ppw_floor, etc.)
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PEOPLE & ORG
-- =====================

-- People (reps, managers, everyone)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    profile_image_url TEXT,
    
    -- Current state (denormalized for fast queries)
    role_id UUID REFERENCES roles(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'onboarding', 'active', 'inactive', 'terminated'
    office_id UUID REFERENCES offices(id),
    recruited_by_id UUID REFERENCES people(id),
    reports_to_id UUID REFERENCES people(id),
    
    -- Dates
    hire_date DATE,
    termination_date DATE,
    
    -- External IDs
    quickbase_id VARCHAR(100),
    auth_user_id VARCHAR(100), -- Clerk user ID
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for team_lead after people table exists
ALTER TABLE teams ADD CONSTRAINT fk_team_lead FOREIGN KEY (team_lead_id) REFERENCES people(id);

-- Person team memberships (with history)
CREATE TABLE person_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) NOT NULL,
    team_id UUID REFERENCES teams(id) NOT NULL,
    role_in_team VARCHAR(50) DEFAULT 'member', -- 'member', 'lead', 'co-lead'
    effective_date DATE NOT NULL,
    end_date DATE, -- null if current
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Person pay plan assignments (with history)
CREATE TABLE person_pay_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) NOT NULL,
    pay_plan_id UUID REFERENCES pay_plans(id) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE, -- null if current
    notes TEXT, -- for special deal documentation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive person history (tracks ALL changes)
CREATE TABLE person_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) NOT NULL,
    
    -- What changed
    change_type VARCHAR(50) NOT NULL, -- 'role_change', 'status_change', 'office_change', 'reports_to_change', 'pay_plan_change', 'team_join', 'team_leave', 'hired', 'terminated'
    
    -- Values
    previous_value JSONB, -- old value(s)
    new_value JSONB, -- new value(s)
    
    -- Context
    effective_date DATE NOT NULL,
    reason TEXT, -- explanation for the change
    changed_by_id UUID REFERENCES people(id), -- who made the change
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org state snapshots (for commission calculations)
-- Captures full org state at a point in time for accurate historical calcs
CREATE TABLE org_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) NOT NULL,
    snapshot_date DATE NOT NULL,
    
    -- Org state at this date
    role_id UUID REFERENCES roles(id),
    role_name VARCHAR(100),
    office_id UUID REFERENCES offices(id),
    office_name VARCHAR(100),
    reports_to_id UUID REFERENCES people(id),
    reports_to_name VARCHAR(200),
    recruited_by_id UUID REFERENCES people(id),
    recruited_by_name VARCHAR(200),
    pay_plan_id UUID REFERENCES pay_plans(id),
    pay_plan_name VARCHAR(100),
    team_ids UUID[],
    team_names TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(person_id, snapshot_date)
);

-- =====================
-- RECRUITING PIPELINE
-- =====================

CREATE TABLE recruits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Pipeline
    status VARCHAR(50) DEFAULT 'lead', -- 'lead', 'contacted', 'interviewing', 'offer_sent', 'agreement_sent', 'agreement_signed', 'onboarding', 'converted', 'rejected', 'dropped'
    source VARCHAR(100), -- where they came from
    
    -- Assignments
    recruiter_id UUID REFERENCES people(id) NOT NULL,
    target_office_id UUID REFERENCES offices(id),
    target_team_id UUID REFERENCES teams(id),
    target_reports_to_id UUID REFERENCES people(id),
    target_role_id UUID REFERENCES roles(id),
    target_pay_plan_id UUID REFERENCES pay_plans(id),
    
    -- Agreement tracking
    signnow_document_id VARCHAR(100),
    agreement_sent_at TIMESTAMPTZ,
    agreement_signed_at TIMESTAMPTZ,
    agreement_document_url TEXT,
    
    -- Conversion
    converted_to_person_id UUID REFERENCES people(id),
    converted_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recruit activity/status history
CREATE TABLE recruit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruit_id UUID REFERENCES recruits(id) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by_id UUID REFERENCES people(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DEALS & COMMISSIONS
-- =====================

-- Deals (synced from QuickBase or manual entry)
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External ID
    quickbase_id VARCHAR(100) UNIQUE,
    
    -- Rep assignment
    rep_id UUID REFERENCES people(id) NOT NULL,
    office_id UUID REFERENCES offices(id),
    
    -- Customer info
    customer_name VARCHAR(200),
    customer_address TEXT,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Deal details
    deal_type VARCHAR(50) NOT NULL, -- 'solar', 'hvac', 'roofing'
    system_size_kw DECIMAL(10,3), -- for solar
    ppw DECIMAL(10,4), -- price per watt for solar
    deal_value DECIMAL(12,2) NOT NULL,
    
    -- Dates
    sale_date DATE,
    close_date DATE,
    install_date DATE,
    pto_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'sold', -- 'sold', 'pending', 'permitted', 'scheduled', 'installed', 'pto', 'complete', 'cancelled'
    
    -- Org snapshot at time of close (for commission calc)
    org_snapshot_id UUID REFERENCES org_snapshots(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calculated commissions
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links
    deal_id UUID REFERENCES deals(id) NOT NULL,
    person_id UUID REFERENCES people(id) NOT NULL,
    
    -- Commission details
    commission_type VARCHAR(50) NOT NULL, -- 'base', 'override_reports_to_l1', 'override_reports_to_l2', 'override_recruited_by_l1', 'recruiting_bonus'
    amount DECIMAL(12,2) NOT NULL,
    
    -- Calculation audit trail
    commission_rule_id UUID REFERENCES commission_rules(id),
    pay_plan_id UUID REFERENCES pay_plans(id),
    calc_details JSONB NOT NULL, -- full breakdown of calculation
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'held', 'clawback'
    status_reason TEXT, -- reason for hold/clawback
    
    -- Payroll
    pay_period_date DATE,
    paid_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission status history
CREATE TABLE commission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES commissions(id) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by_id UUID REFERENCES people(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- AUDIT & ACTIVITY
-- =====================

-- General activity log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What
    entity_type VARCHAR(50) NOT NULL, -- 'person', 'deal', 'commission', 'recruit', 'office', 'team', 'pay_plan', 'role'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'commission_calculated', etc.
    
    -- Details
    details JSONB,
    
    -- Who
    actor_id UUID REFERENCES people(id),
    actor_type VARCHAR(50) DEFAULT 'user', -- 'user', 'system', 'webhook'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

-- Roles
CREATE INDEX idx_roles_active ON roles(is_active);
CREATE INDEX idx_roles_level ON roles(level);

-- Offices
CREATE INDEX idx_offices_active ON offices(is_active);
CREATE INDEX idx_offices_region ON offices(region);

-- Teams
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_teams_office ON teams(office_id);
CREATE INDEX idx_teams_lead ON teams(team_lead_id);

-- People
CREATE INDEX idx_people_role ON people(role_id);
CREATE INDEX idx_people_status ON people(status);
CREATE INDEX idx_people_office ON people(office_id);
CREATE INDEX idx_people_recruited_by ON people(recruited_by_id);
CREATE INDEX idx_people_reports_to ON people(reports_to_id);
CREATE INDEX idx_people_quickbase ON people(quickbase_id);
CREATE INDEX idx_people_auth_user ON people(auth_user_id);
CREATE INDEX idx_people_email ON people(email);

-- Person teams
CREATE INDEX idx_person_teams_person ON person_teams(person_id);
CREATE INDEX idx_person_teams_team ON person_teams(team_id);
CREATE INDEX idx_person_teams_active ON person_teams(person_id) WHERE end_date IS NULL;

-- Person pay plans
CREATE INDEX idx_person_pay_plans_person ON person_pay_plans(person_id);
CREATE INDEX idx_person_pay_plans_active ON person_pay_plans(person_id) WHERE end_date IS NULL;

-- Person history
CREATE INDEX idx_person_history_person ON person_history(person_id);
CREATE INDEX idx_person_history_type ON person_history(change_type);
CREATE INDEX idx_person_history_date ON person_history(effective_date);

-- Org snapshots
CREATE INDEX idx_org_snapshots_person ON org_snapshots(person_id);
CREATE INDEX idx_org_snapshots_date ON org_snapshots(snapshot_date);

-- Recruits
CREATE INDEX idx_recruits_status ON recruits(status);
CREATE INDEX idx_recruits_recruiter ON recruits(recruiter_id);
CREATE INDEX idx_recruits_email ON recruits(email);

-- Deals
CREATE INDEX idx_deals_rep ON deals(rep_id);
CREATE INDEX idx_deals_office ON deals(office_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_type ON deals(deal_type);
CREATE INDEX idx_deals_close_date ON deals(close_date);
CREATE INDEX idx_deals_quickbase ON deals(quickbase_id);

-- Commissions
CREATE INDEX idx_commissions_deal ON commissions(deal_id);
CREATE INDEX idx_commissions_person ON commissions(person_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_type ON commissions(commission_type);
CREATE INDEX idx_commissions_pay_period ON commissions(pay_period_date);

-- Activity log
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_actor ON activity_log(actor_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);

-- Commission rules
CREATE INDEX idx_commission_rules_pay_plan ON commission_rules(pay_plan_id);
CREATE INDEX idx_commission_rules_active ON commission_rules(is_active);
```

---

## API Endpoints (Full Reference)

```
# =====================
# AUTH
# =====================
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh

# =====================
# CONFIGURATION
# =====================

# Roles
GET    /api/roles
POST   /api/roles
GET    /api/roles/[id]
PUT    /api/roles/[id]
DELETE /api/roles/[id]  # soft delete (is_active = false)
PUT    /api/roles/reorder  # update sort_order

# Offices
GET    /api/offices
POST   /api/offices
GET    /api/offices/[id]
PUT    /api/offices/[id]
DELETE /api/offices/[id]
GET    /api/offices/[id]/people
GET    /api/offices/[id]/teams
GET    /api/offices/[id]/deals

# Teams
GET    /api/teams
POST   /api/teams
GET    /api/teams/[id]
PUT    /api/teams/[id]
DELETE /api/teams/[id]
GET    /api/teams/[id]/members
POST   /api/teams/[id]/members  # add person to team
DELETE /api/teams/[id]/members/[personId]  # remove person from team

# Pay Plans
GET    /api/pay-plans
POST   /api/pay-plans
GET    /api/pay-plans/[id]
PUT    /api/pay-plans/[id]
DELETE /api/pay-plans/[id]
GET    /api/pay-plans/[id]/rules
POST   /api/pay-plans/[id]/rules
PUT    /api/pay-plans/[id]/rules/[ruleId]
DELETE /api/pay-plans/[id]/rules/[ruleId]

# =====================
# PEOPLE
# =====================
GET    /api/people
POST   /api/people
GET    /api/people/[id]
PUT    /api/people/[id]
DELETE /api/people/[id]  # soft delete (status = 'terminated')

# Person relationships
GET    /api/people/[id]/history  # all historical changes
GET    /api/people/[id]/timeline  # formatted timeline view
GET    /api/people/[id]/teams
GET    /api/people/[id]/pay-plans
GET    /api/people/[id]/deals
GET    /api/people/[id]/commissions
GET    /api/people/[id]/recruits  # people they recruited
GET    /api/people/[id]/downline  # full org tree below them

# Person actions
POST   /api/people/[id]/change-role
POST   /api/people/[id]/change-office
POST   /api/people/[id]/change-manager
POST   /api/people/[id]/change-pay-plan
POST   /api/people/[id]/terminate

# Org chart
GET    /api/org-chart  # full org tree
GET    /api/org-chart/[personId]  # tree from specific person down

# =====================
# RECRUITING
# =====================
GET    /api/recruits
POST   /api/recruits
GET    /api/recruits/[id]
PUT    /api/recruits/[id]
DELETE /api/recruits/[id]

# Recruit actions
POST   /api/recruits/[id]/send-agreement  # triggers SignNow
POST   /api/recruits/[id]/advance-status  # move to next status
POST   /api/recruits/[id]/reject
POST   /api/recruits/[id]/convert  # creates person record
GET    /api/recruits/[id]/history

# =====================
# DEALS
# =====================
GET    /api/deals
POST   /api/deals  # manual entry
GET    /api/deals/[id]
PUT    /api/deals/[id]
GET    /api/deals/[id]/commissions

# Deal actions
POST   /api/deals/[id]/calculate-commissions  # manual trigger

# =====================
# COMMISSIONS
# =====================
GET    /api/commissions
GET    /api/commissions/[id]
PUT    /api/commissions/[id]

# Commission actions
POST   /api/commissions/[id]/approve
POST   /api/commissions/[id]/hold
POST   /api/commissions/[id]/clawback
POST   /api/commissions/bulk-approve
POST   /api/commissions/bulk-hold

# =====================
# PAYROLL
# =====================
GET    /api/payroll/pending  # commissions ready for payroll
GET    /api/payroll/summary  # aggregated by person
POST   /api/payroll/export  # generate CSV
POST   /api/payroll/mark-paid  # bulk update to paid

# =====================
# DASHBOARD
# =====================
GET    /api/dashboard/stats

# =====================
# WEBHOOKS
# =====================
POST   /api/webhooks/signnow  # document signed events

# =====================
# ACTIVITY
# =====================
GET    /api/activity  # activity log with filters
GET    /api/activity/[entityType]/[entityId]  # activity for specific entity
```

---

## Key User Flows

### Flow 1: New Recruit → Signed → Onboarded → Active Rep

```
1. Recruiter creates recruit
   └─ POST /api/recruits
   └─ Assigns: recruiter_id, target_office_id, target_team_id, target_reports_to_id, target_role_id, target_pay_plan_id
   └─ Status: 'lead'

2. Recruiter advances through pipeline
   └─ POST /api/recruits/[id]/advance-status
   └─ Status: 'lead' → 'contacted' → 'interviewing' → 'offer_sent'

3. Recruiter sends agreement
   └─ POST /api/recruits/[id]/send-agreement
   └─ System calls SignNow API:
      └─ Create document from template
      └─ Pre-fill: name, email, role, office, pay plan summary, recruiter
      └─ Send for signature
   └─ Store signnow_document_id
   └─ Status: 'agreement_sent'

4. Recruit signs (webhook)
   └─ POST /api/webhooks/signnow
   └─ Update: agreement_signed_at, agreement_document_url
   └─ Status: 'agreement_signed'

5. Admin moves to onboarding
   └─ POST /api/recruits/[id]/advance-status
   └─ Status: 'onboarding'
   └─ Trigger: notification to create knocking tool accounts

6. Admin converts to person
   └─ POST /api/recruits/[id]/convert
   └─ Creates person record:
      └─ role_id = target_role_id
      └─ office_id = target_office_id
      └─ reports_to_id = target_reports_to_id
      └─ recruited_by_id = recruiter_id
      └─ status = 'active'
      └─ hire_date = today
   └─ Creates person_pay_plans record
   └─ Creates person_teams record (if target_team_id set)
   └─ Creates person_history record (type: 'hired')
   └─ Creates org_snapshot for today
   └─ Links recruit.converted_to_person_id
   └─ Status: 'converted'
```

### Flow 2: Deal Closes → Commissions Calculated

```
1. Deal created (manual entry for MVP)
   └─ POST /api/deals
   └─ Creates deal record with rep_id, deal details

2. User triggers commission calculation
   └─ POST /api/deals/[id]/calculate-commissions

3. Commission engine runs
   └─ Get or create org_snapshot for rep as of close_date
      └─ Captures: role, office, reports_to, recruited_by, pay_plan, teams
   
   └─ Calculate BASE commission:
      └─ Get rep's pay_plan as of close_date
      └─ Find commission_rule where rule_type = 'base_commission'
      └─ Apply calc_method:
         └─ flat_per_kw: amount × system_size_kw
         └─ percentage_of_deal: amount × deal_value
         └─ flat_fee: amount
      └─ Create commission record for rep
   
   └─ Calculate OVERRIDES (reports_to chain):
      └─ Get reports_to person
      └─ For each override_level (1, 2, 3...):
         └─ Get that person's pay_plan
         └─ Find commission_rule where:
            └─ rule_type = 'override'
            └─ override_source = 'reports_to'
            └─ override_level = current level
         └─ Apply calc_method
         └─ Create commission record
         └─ Move up chain: person = person.reports_to
         └─ Stop when no more rules or no more chain
   
   └─ Calculate OVERRIDES (recruited_by chain):
      └─ Same logic but following recruited_by links
      └─ Only if rules with override_source = 'recruited_by' exist
   
   └─ All commissions created with:
      └─ status = 'pending'
      └─ calc_details = full breakdown JSON
      └─ org_snapshot_id = snapshot used

4. Commission records ready for approval
```

### Flow 3: Person Promotion

```
1. Admin promotes rep to Team Lead
   └─ POST /api/people/[id]/change-role
   └─ Body: { new_role_id: 'uuid', effective_date: '2025-02-01', reason: 'Promoted based on Q4 performance' }

2. System updates person
   └─ Update person.role_id
   └─ Create person_history record:
      └─ change_type: 'role_change'
      └─ previous_value: { role_id: 'old-uuid', role_name: 'Sales Rep' }
      └─ new_value: { role_id: 'new-uuid', role_name: 'Team Lead' }
      └─ effective_date
      └─ reason
      └─ changed_by_id

3. If pay plan should change:
   └─ POST /api/people/[id]/change-pay-plan
   └─ Ends current person_pay_plans record (set end_date)
   └─ Creates new person_pay_plans record
   └─ Creates person_history record (type: 'pay_plan_change')

4. Future deals by this person's downline will use new role for override calculations
```

### Flow 4: Payroll Run

```
1. Admin opens payroll for pay period
   └─ GET /api/payroll/pending?start=2025-01-01&end=2025-01-15
   └─ Returns all commissions with status = 'pending' or 'approved' in date range

2. Admin reviews
   └─ Can filter by office, team, person
   └─ Can drill into individual commissions to see calc_details

3. Admin approves commissions
   └─ POST /api/commissions/bulk-approve
   └─ Body: { commission_ids: [...] }
   └─ Updates status to 'approved'

4. Admin generates export
   └─ POST /api/payroll/export
   └─ Body: { pay_period_start, pay_period_end, format: 'csv' }
   └─ System aggregates by person
   └─ Returns CSV file

5. Admin marks as paid (after payroll submitted)
   └─ POST /api/payroll/mark-paid
   └─ Body: { commission_ids: [...] }
   └─ Updates status to 'paid', sets paid_at
```

---

## SignNow Integration Details

**Purpose:** Send and track rep agreements

**Environment Variables:**
```
SIGNNOW_API_KEY=your_api_key
SIGNNOW_API_URL=https://api.signnow.com
SIGNNOW_TEMPLATE_ID=your_template_id
SIGNNOW_WEBHOOK_SECRET=your_webhook_secret
```

**API Flow:**
```typescript
// lib/signnow/client.ts

// 1. Create document from template
async function createDocument(templateId: string, documentName: string) {
  const response = await fetch(`${SIGNNOW_API_URL}/template/${templateId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SIGNNOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ document_name: documentName })
  });
  return response.json(); // returns { id: 'document_id' }
}

// 2. Pre-fill fields
async function prefillFields(documentId: string, fields: Record<string, string>) {
  const response = await fetch(`${SIGNNOW_API_URL}/document/${documentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SIGNNOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: Object.entries(fields).map(([name, value]) => ({ name, value })) })
  });
  return response.json();
}

// 3. Send for signature
async function sendInvite(documentId: string, signerEmail: string, from: string) {
  const response = await fetch(`${SIGNNOW_API_URL}/document/${documentId}/invite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SIGNNOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ email: signerEmail, role: 'Signer', order: 1 }],
      from
    })
  });
  return response.json();
}

// 4. Get signed document download URL
async function getDocumentDownloadUrl(documentId: string) {
  const response = await fetch(`${SIGNNOW_API_URL}/document/${documentId}/download/link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SIGNNOW_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json(); // returns { link: 'download_url' }
}
```

**Webhook Handler:**
```typescript
// app/api/webhooks/signnow/route.ts

export async function POST(request: Request) {
  const body = await request.json();
  
  // Verify webhook (check signature if SignNow provides one)
  
  if (body.event === 'document.complete') {
    const documentId = body.document_id;
    
    // Find recruit by signnow_document_id
    const recruit = await db.query.recruits.findFirst({
      where: eq(recruits.signnow_document_id, documentId)
    });
    
    if (recruit) {
      // Get download URL
      const { link } = await getDocumentDownloadUrl(documentId);
      
      // Update recruit
      await db.update(recruits)
        .set({
          status: 'agreement_signed',
          agreement_signed_at: new Date(),
          agreement_document_url: link,
          updated_at: new Date()
        })
        .where(eq(recruits.id, recruit.id));
      
      // Create history record
      await db.insert(recruit_history).values({
        recruit_id: recruit.id,
        previous_status: 'agreement_sent',
        new_status: 'agreement_signed',
        notes: 'Agreement signed via SignNow'
      });
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

---

## UI Pages Structure

```
/app
├── /(auth)
│   ├── /login
│   └── /signup
├── /(dashboard)
│   ├── /dashboard
│   │   └── page.tsx
│   ├── /settings
│   │   ├── page.tsx (settings hub)
│   │   ├── /roles
│   │   │   └── page.tsx
│   │   ├── /offices
│   │   │   └── page.tsx
│   │   ├── /teams
│   │   │   └── page.tsx
│   │   └── /pay-plans
│   │       ├── page.tsx
│   │       └── /[id]
│   │           └── page.tsx (pay plan detail with rules)
│   ├── /people
│   │   ├── page.tsx (list)
│   │   └── /[id]
│   │       └── page.tsx (detail with tabs)
│   ├── /org-chart
│   │   └── page.tsx
│   ├── /recruiting
│   │   ├── page.tsx (pipeline)
│   │   └── /[id]
│   │       └── page.tsx (recruit detail)
│   ├── /deals
│   │   ├── page.tsx (list)
│   │   ├── /new
│   │   │   └── page.tsx (create deal form)
│   │   └── /[id]
│   │       └── page.tsx (detail with commissions)
│   ├── /commissions
│   │   └── page.tsx (list with tabs: pending, approved, paid, held)
│   └── /payroll
│       ├── page.tsx (current period)
│       └── /history
│           └── page.tsx
└── /api
    └── (all API routes as specified above)
```

---

## Environment Variables Template

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# SignNow
SIGNNOW_API_KEY=
SIGNNOW_API_URL=https://api.signnow.com
SIGNNOW_TEMPLATE_ID=
SIGNNOW_WEBHOOK_SECRET=

# Cloudflare R2 (for document storage)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Notes for Traycer

1. **Start with Ticket 1 (Project Setup)** - get the foundation right before building features
2. **Use App Router** - all pages should be in /app directory using Next.js 14+ conventions
3. **Server Components by default** - only use 'use client' when necessary (forms, interactivity)
4. **Drizzle ORM** - create schema files that mirror the SQL schema exactly
5. **shadcn/ui components** - install as needed (npx shadcn-ui@latest add button, etc.)
6. **Zod validation** - create validation schemas for all API inputs
7. **Error handling** - consistent error responses from all API routes
8. **Loading states** - use React Suspense and loading.tsx files
9. **Type safety** - leverage Drizzle's type inference throughout

**DO NOT:**
- Build QuickBase integration (Phase 2)
- Build rep portal (Phase 2)
- Build reporting dashboards (Phase 2)
- Build email notifications (Phase 2)
- Build mobile-specific layouts (Phase 3)
