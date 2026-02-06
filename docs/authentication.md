# Authentication & Authorization System

## Overview

This application uses Supabase Auth for user authentication and implements a custom role-based access control (RBAC) system for authorization. The system provides granular permissions, route protection, and data visibility filtering based on user roles.

## Architecture

### Authentication Flow

1. User authenticates via Supabase Auth (login/signup pages)
2. Supabase provides session cookies and JWT tokens
3. Middleware validates sessions on protected routes and refreshes tokens
4. API routes use `getCurrentUser()` to fetch user from database (linked via `authUserId`)
5. Permission checks are performed using the RBAC system
6. Data visibility is filtered based on user role

### Components

- **Supabase Auth**: Handles user authentication, session management, and JWT validation
- **Database**: Stores person records linked to auth users via `authUserId` (Supabase Auth UUID)
- **Permission System**: Code-based permissions matrix mapping roles to permissions
- **Middleware**: Protects routes and validates Supabase session cookies
- **Visibility Rules**: Filters data based on role hierarchy

## Permission System

### Permissions

The system defines granular permissions in `lib/permissions/types.ts`:

- `MANAGE_SETTINGS` - Manage system configuration
- `MANAGE_ALL_OFFICES` - Manage all offices
- `MANAGE_OWN_REGION` - Manage own region
- `MANAGE_OWN_OFFICE` - Manage own office
- `MANAGE_OWN_TEAM` - Manage own team
- `VIEW_ALL_PEOPLE` - View all people in system
- `VIEW_OWN_OFFICE_PEOPLE` - View people in own office
- `VIEW_OWN_TEAM` - View own team members
- `CREATE_RECRUITS` - Create new recruits
- `APPROVE_COMMISSIONS` - Approve commission payments
- `RUN_PAYROLL` - Execute payroll runs
- `VIEW_OWN_DATA_ONLY` - Restricted to own data

### Role Permissions Matrix

| Permission | Admin | Regional Manager | Area Director | Team Lead | Sales Rep |
|------------|-------|------------------|---------------|-----------|-----------|
| Manage settings/config | ✓ | | | | |
| Manage all offices | ✓ | | | | |
| Manage own region | ✓ | ✓ | | | |
| Manage own office | ✓ | ✓ | ✓ | | |
| Manage own team | ✓ | ✓ | ✓ | ✓ | |
| View all people | ✓ | ✓ | | | |
| View own office people | ✓ | ✓ | ✓ | ✓ | |
| View own team | ✓ | ✓ | ✓ | ✓ | |
| Create recruits | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve commissions | ✓ | ✓ | | | |
| Run payroll | ✓ | | | | |
| View own data only | | | | | ✓ |

## Usage

### API Route Protection

#### Basic Authentication

Use `withAuth()` to protect routes that require authentication:

\`\`\`typescript
import { withAuth } from "@/lib/auth/route-protection";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (req, user) => {
  // user is guaranteed to be authenticated
  return NextResponse.json({ user });
});
\`\`\`

#### Permission-Based Protection

Use `withPermission()` to protect routes that require specific permissions:

\`\`\`typescript
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = withPermission(
  Permission.VIEW_ALL_PEOPLE,
  async (req, user) => {
    // user is authenticated AND has VIEW_ALL_PEOPLE permission
    const people = await getPeople();
    return NextResponse.json({ people });
  }
);
\`\`\`

### Server-Side Helpers

#### Get Current User

\`\`\`typescript
import { getCurrentUser } from "@/lib/auth/get-current-user";

const user = await getCurrentUser();
if (!user) {
  // Not authenticated
}
\`\`\`

#### Check Permissions

\`\`\`typescript
import { hasPermission, requirePermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

if (hasPermission(user, Permission.APPROVE_COMMISSIONS)) {
  // User has permission
}

// Or throw error if permission denied
requirePermission(user, Permission.APPROVE_COMMISSIONS);
\`\`\`

#### Visibility Rules

\`\`\`typescript
import { canViewPerson, getVisibilityFilter } from "@/lib/auth/visibility-rules";

// Check if user can view a specific person
const canView = await canViewPerson(user, targetPersonId);

// Get filter criteria for queries
const filter = getVisibilityFilter(user);
// Returns: null (all), { officeId }, { id }, etc.
\`\`\`

### Client-Side Components

#### Permission Guard

Conditionally render components based on permissions:

\`\`\`tsx
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Permission } from "@/lib/permissions/types";

<PermissionGuard permission={Permission.APPROVE_COMMISSIONS}>
  <ApproveButton />
</PermissionGuard>
\`\`\`

#### Role Guard

Conditionally render components based on roles:

\`\`\`tsx
import { RoleGuard } from "@/components/auth/role-guard";

<RoleGuard allowedRoles={["Admin", "Regional Manager"]}>
  <AdminPanel />
</RoleGuard>
\`\`\`

## Data Visibility Rules

The system automatically filters data based on user roles:

- **Admin/Regional Manager**: Can see all data (no filter)
- **Area Director**: Can see data from their office (`officeId = user.officeId`)
- **Team Lead**: Can see data from their office OR people who report to them
- **Sales Rep**: Can only see their own data (`id = user.id`)

### Applying Visibility Filters

\`\`\`typescript
import { applyCommissionVisibilityFilter } from "@/lib/auth/visibility-rules";
import { db } from "@/lib/db";
import { commissions, people } from "@/lib/db/schema";

const user = await getCurrentUser();
const query = db.select().from(commissions).innerJoin(people, ...);
const filteredQuery = applyCommissionVisibilityFilter(user, query);
const results = await filteredQuery;
\`\`\`

## Environment Variables

Required environment variables (see `.env.example`):

\`\`\`env
# Supabase Auth and database access
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://...
\`\`\`

- **NEXT_PUBLIC_SUPABASE_URL** - Supabase project URL (client-side auth and API)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key for client-side auth and session validation
- **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key for server-side operations (e.g. document storage, admin APIs)

## Schema Migration (Supabase Auth & Storage)

The database has been updated to support Supabase Auth and Storage:

- **`people.authUserId`** now stores **Supabase Auth user IDs (UUID)** instead of Clerk user IDs. The column type is `uuid`. Existing Clerk-based records will have `authUserId` set to `NULL` until they are re-linked with Supabase Auth in a later phase. A data migration strategy is required for handling existing users when fully switching to Supabase Auth.
- **`recruits.agreementDocumentPath`** is a new nullable `text` column for Supabase Storage bucket paths (e.g. `agreements/recruit-{id}/document.pdf`). The existing **`recruits.agreementDocumentUrl`** field is unchanged and remains for backward compatibility (e.g. SignNow document URLs) during the migration period.

Migration file: `drizzle/0000_futuristic_sabra.sql` (applied via `npm run db:migrate` with `DATABASE_URL` set).

## User Onboarding

When a new user signs up via Supabase Auth:

1. Supabase creates the user account (email/password or OAuth)
2. User is redirected to `/dashboard` (or onboarding flow)
3. The application calls `/api/auth/sync-user` to link the Supabase user to a person record
4. The sync endpoint matches the auth user's email to an existing person or creates/updates a person record with the `authUserId` (Supabase UUID) field

## Testing

Mock user helpers are available in `lib/auth/__tests__/test-helpers.ts`:

\`\`\`typescript
import { createMockAdmin, createMockSalesRep } from "@/lib/auth/__tests__/test-helpers";

const admin = createMockAdmin();
const rep = createMockSalesRep();
\`\`\`

## Security Considerations

1. **Never trust client-side permission checks alone** - Always verify permissions server-side
2. **Use `withPermission()` in API routes** - This ensures both authentication and authorization
3. **Apply visibility filters to all data queries** - Don't rely on UI hiding data
4. **Validate user input** - Even authenticated users should not be able to access other users' data
5. **Keep permissions granular** - Add new permissions as needed rather than using overly broad permissions

## Future Enhancements

- Dynamic permissions stored in database (currently code-based)
- Permission inheritance and role hierarchies
- Audit logging for permission checks
- Fine-grained resource-level permissions
- Permission caching for performance

## Migration from Clerk to Supabase Auth

### Timeline and Phases

The application has completed migration from Clerk to Supabase Auth. All authentication flows (login, signup, logout, session validation) now use Supabase Auth exclusively.

### Key Differences

| Aspect | Clerk | Supabase Auth |
|--------|-------|----------------|
| Provider wrapper | `ClerkProvider` in root layout | None; middleware and server utilities handle sessions |
| Session storage | Clerk-managed cookies/JWT | Supabase SSR cookies via `@supabase/ssr` |
| User ID format | Clerk string IDs (e.g. `user_...`) | Supabase UUID |
| Current user | `auth()` from `@clerk/nextjs/server` | `createClient()` from `lib/supabase/server` + `getSession()` |
| Client user data | `useUser()` from `@clerk/nextjs` | `/api/auth/me` + app database person record |

### Data Migration Strategy

- **`people.authUserId`** was migrated from storing Clerk user IDs to Supabase Auth UUIDs. Existing person rows that were linked to Clerk users had `authUserId` set to `NULL` until re-linked.
- User linking is performed by `/api/auth/sync-user`, which matches the authenticated user's email to a person record and sets `authUserId` to the Supabase user's UUID.
- No Clerk IDs remain in the database; all new and re-linked users use Supabase UUIDs.

### Rollback Considerations

If legacy data or integrations still reference Clerk user IDs, those references would need to be updated or migrated. The codebase no longer includes Clerk dependencies; rollback would require re-adding `@clerk/nextjs` and restoring Clerk-specific code from version control.

### Testing Checklist

After migration, verify:

1. **Login** - User can sign in via Supabase (email/password or OAuth if configured).
2. **Signup** - New user can register; redirect to dashboard or onboarding works.
3. **Logout** - Sign out clears session and redirects to login.
4. **Protected routes** - Unauthenticated access to `/dashboard` and app routes redirects to `/login`.
5. **Root page** - `/` redirects to `/dashboard` when authenticated, `/login` when not.
6. **User profile** - Navbar user menu shows correct name, email, role from `/api/auth/me`.
7. **API routes** - `withAuth` and `withPermission` resolve the current user from Supabase session and database.
8. **Middleware** - Session refresh and route protection work without Clerk.
