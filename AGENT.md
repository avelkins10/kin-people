# AGENT.md - AI Agent Documentation

This document provides essential information for AI agents working on this codebase.

---

## 1. KIN ID System

KIN IDs are unique, human-readable identifiers for people in the system.

### Format
- Pattern: `KIN-XXXX` (e.g., `KIN-0001`, `KIN-0042`, `KIN-1234`)
- Zero-padded to 4 digits minimum
- Sequential, never reused

### Key Rules
- **ALWAYS generate when creating a person** (never before)
- Use `generateKinId(tx?)` from `lib/db/helpers/kin-id-helpers.ts`
- Atomic sequence via `kin_id_sequence` table (UPDATE ... RETURNING)
- **Never duplicates, never changes once assigned**

### Functions
```typescript
// Generate next KIN ID atomically (use within transaction)
import { generateKinId } from "@/lib/db/helpers/kin-id-helpers";
const kinId = await generateKinId(tx); // "KIN-0001"

// Assign KIN ID to existing person (idempotent)
import { assignKinIdToPerson } from "@/lib/db/helpers/kin-id-helpers";
const kinId = await assignKinIdToPerson(personId, tx);

// Look up person by KIN ID
import { getPersonByKinId } from "@/lib/db/helpers/kin-id-helpers";
const person = await getPersonByKinId("KIN-0001");
```

---

## 2. People/Recruits Flow

### Recruit Pipeline
```
lead → contacted → interviewing → offer_sent → agreement_sent → agreement_signed → converted
```

### Person Lifecycle
```
onboarding → active → terminated
```

### Conversion Flow
```
Recruit (agreement_signed) → convertRecruitToOnboarding() → Person (status: onboarding)
```

### Key Function
```typescript
import { convertRecruitToOnboarding } from "@/lib/db/helpers/recruit-helpers";

// Called when rep agreement is signed
// - Creates person with status "onboarding"
// - Generates KIN ID
// - Sets up pay plan and team
// - Initializes onboarding tasks
// - Updates recruit status to "onboarding"
// - Sends welcome email (async, non-blocking)
const result = await convertRecruitToOnboarding(recruitId);
// Returns { personId: string } or null on failure
```

### Important Notes
- **Always use transactions** for multi-table operations
- Recruit remains in system after conversion (linked via `convertedToPersonId`)
- Conversion checks for duplicate person before proceeding

---

## 3. Duplicate Detection (CRITICAL)

**ALWAYS check for duplicates before creating** people or recruits.

### Location
`lib/db/helpers/duplicate-helpers.ts`

### Functions
```typescript
import {
  checkForDuplicatePerson,
  checkForDuplicateRecruit,
  normalizePhone,
  formatDuplicateError
} from "@/lib/db/helpers/duplicate-helpers";

// Check for duplicate person
const result = await checkForDuplicatePerson(email, phone, excludeId?);
if (result.isDuplicate) {
  // result.matchedOn: ("email" | "phone")[]
  // result.existingRecord: { id, kinId, firstName, lastName, email }
  const errorMsg = formatDuplicateError(result, "person");
}

// Check for duplicate recruit
const result = await checkForDuplicateRecruit(email, phone, excludeId?);
```

### Phone Normalization
```typescript
// ALWAYS store normalizedPhone alongside phone
const normalizedPhone = normalizePhone("+1 (801) 928-6369"); // "8019286369"

// Insert with both values
await db.insert(people).values({
  phone: rawPhone,
  normalizedPhone: normalizePhone(rawPhone),
  // ...
});
```

### Normalization Rules
- Strips all non-digit characters
- Removes leading "1" for US numbers
- Returns `null` for invalid (non-10-digit) numbers

---

## 4. Relationships

### Self-Referential Foreign Keys on `people` Table

| Field | Description |
|-------|-------------|
| `reportsToId` | Manager relationship (who this person reports to) |
| `recruitedById` | Recruiter relationship (who recruited this person) |

### Team Membership (Temporal)
```typescript
// personTeams table - supports history
{
  personId: string;
  teamId: string;
  roleInTeam: "member" | "lead";
  effectiveDate: string;  // ISO date
  endDate?: string;       // null = current
}
```

### Office Leadership (Temporal)
```typescript
// officeLeadership table
{
  officeId: string;
  personId: string;
  leadershipRole: "regional_manager" | "area_director";
  effectiveDate: string;
  endDate?: string;
}
```

### Querying Relationships
```typescript
// Get person's manager
const person = await db.select().from(people).where(eq(people.id, personId));
const managerId = person.reportsToId;

// Get direct reports
const reports = await db
  .select()
  .from(people)
  .where(eq(people.reportsToId, managerId));
```

---

## 5. History Tracking

### Person History
```typescript
// personHistory table - tracks all changes
{
  personId: string;
  changeType: "hired" | "role_change" | "office_change" | "status_change" | "termination" | "other";
  previousValue: jsonb;     // { field: oldValue, ... }
  newValue: jsonb;          // { field: newValue, ... }
  effectiveDate: string;
  reason?: string;
  changedById?: string;     // IMPORTANT: Always set for audit trail
  createdAt: timestamp;
}
```

### Recruit History
```typescript
// recruitHistory table - tracks status transitions
{
  recruitId: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
  changedById?: string;     // IMPORTANT: Always set for audit trail
  createdAt: timestamp;
}
```

### Recording Changes
```typescript
import { createRecruitHistoryRecord } from "@/lib/db/helpers/recruit-helpers";

await createRecruitHistoryRecord({
  recruitId,
  previousStatus: currentRecruit.status,
  newStatus: "interviewing",
  notes: "Scheduled interview for Monday",
  changedById: userId,  // Always include!
});
```

---

## 6. Permission System

### Route Protection
```typescript
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

// Basic auth check
export const GET = withAuth(async (req, user) => {
  // user is guaranteed to exist
});

// Permission check
export const POST = withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
  // user has MANAGE_OWN_OFFICE permission
});
```

### Key Permissions
| Permission | Description |
|------------|-------------|
| `VIEW_ALL_PEOPLE` | Admin - see everyone |
| `MANAGE_ALL_OFFICES` | Admin - manage everyone |
| `MANAGE_OWN_REGION` | Regional Manager |
| `MANAGE_OWN_OFFICE` | Area Director / Office Manager |
| `MANAGE_OWN_TEAM` | Team Lead |
| `VIEW_OWN_DATA_ONLY` | Sales Rep |
| `MANAGE_SETTINGS` | Can modify app settings |

### Visibility Rules
```typescript
import { canViewPerson, canManagePerson } from "@/lib/auth/visibility-rules";

// Check if user can view a person
const canView = await canViewPerson(user, targetPersonId);

// Check if user can manage a person
const canManage = await canManagePerson(user, targetPersonId);
```

### Visibility Hierarchy
```
Admin → All people
Regional Manager → All people in offices within their region
Area Director → All people in their office
Team Lead → All people in their team (direct reports)
Sales Rep → Only themselves
```

---

## 7. API Patterns

### Request Validation
```typescript
import { z } from "zod";

const CreatePersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  officeId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const parsed = CreatePersonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Use parsed.data
});
```

### Duplicate Check Pattern
```typescript
// ALWAYS check before insert
const duplicate = await checkForDuplicatePerson(email, phone);
if (duplicate.isDuplicate) {
  return NextResponse.json(
    { error: formatDuplicateError(duplicate, "person") },
    { status: 409 }
  );
}
```

### Transaction Pattern
```typescript
import { db } from "@/lib/db";

const result = await db.transaction(async (tx) => {
  // Generate KIN ID within transaction
  const kinId = await generateKinId(tx);

  // Create person
  const [person] = await tx.insert(people).values({
    kinId,
    // ...
  }).returning();

  // Create related records
  await tx.insert(personTeams).values({
    personId: person.id,
    teamId,
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  return person;
});
```

### Response Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Permission denied |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

---

## 8. Email Service

### Location
`lib/services/email-service.ts`

### Key Principle: Non-Blocking
Emails should **never block** the main operation. Use `.then().catch()` pattern:

```typescript
import { sendWelcomeEmail } from "@/lib/services/email-service";

// After successful operation, send email async
sendWelcomeEmail({
  email: person.email,
  firstName: person.firstName,
  lastName: person.lastName,
  managerName: manager?.name,
  officeName: office?.name,
}).then((result) => {
  if (result.success) {
    console.log("Email sent:", result.messageId);
  } else {
    console.warn("Email failed:", result.error);
  }
}).catch((err) => {
  console.warn("Email error:", err);
});

// Don't await - return immediately
return NextResponse.json({ success: true, personId: person.id });
```

### Available Functions
```typescript
// Welcome email - sent on recruit conversion
sendWelcomeEmail({ email, firstName, lastName?, managerName?, officeName?, onboardingUrl? })

// Reminder email - manual trigger by managers
sendOnboardingReminderEmail({ email, firstName, managerName?, pendingTaskCount, onboardingUrl? })

// Completion email - sent when all tasks done
sendOnboardingCompleteEmail({ email, firstName, managerName?, managerEmail? })
```

### Templates
- Stored in `app_settings` table as JSON
- Keys: `email_template_welcome`, `email_template_reminder`, `email_template_completion`
- Template variables use `{{variableName}}` syntax
- Falls back to hardcoded defaults if not configured

### Configuration
- Requires `RESEND_API_KEY` environment variable
- `RESEND_FROM_EMAIL` for sender address (default: `The KIN Team <team@kinhome.com>`)
- `NEXT_PUBLIC_APP_URL` for portal URLs

---

## Quick Reference

### Creating a Person
1. Validate input with Zod
2. Check for duplicates (`checkForDuplicatePerson`)
3. Start transaction
4. Generate KIN ID (`generateKinId(tx)`)
5. Normalize phone (`normalizePhone`)
6. Insert person with kinId and normalizedPhone
7. Create related records (teams, pay plans)
8. Create history record
9. Commit transaction
10. Send welcome email (non-blocking)

### Creating a Recruit
1. Validate input
2. Check for duplicates (`checkForDuplicateRecruit`)
3. Check if already hired (`checkIfAlreadyHired`)
4. Normalize phone
5. Insert recruit
6. Create history record

### Converting Recruit to Person
Use `convertRecruitToOnboarding(recruitId)` - handles everything automatically.
