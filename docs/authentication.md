# Authentication & Authorization System

## Overview

This application uses Clerk for user authentication and implements a custom role-based access control (RBAC) system for authorization. The system provides granular permissions, route protection, and data visibility filtering based on user roles.

## Architecture

### Authentication Flow

1. User authenticates via Clerk (login/signup pages)
2. Clerk provides authentication tokens
3. Middleware validates tokens on protected routes
4. API routes use `getCurrentUser()` to fetch user from database
5. Permission checks are performed using the RBAC system
6. Data visibility is filtered based on user role

### Components

- **Clerk**: Handles user authentication, session management, and user profiles
- **Database**: Stores person records linked to Clerk users via `authUserId`
- **Permission System**: Code-based permissions matrix mapping roles to permissions
- **Middleware**: Protects routes and validates authentication
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

| Permission | Admin | Regional Manager | Office Manager | Area Director | Team Lead | Sales Rep |
|------------|-------|------------------|----------------|---------------|-----------|-----------|
| Manage settings/config | ✓ | | | | | |
| Manage all offices | ✓ | | | | | |
| Manage own region | ✓ | ✓ | | | | |
| Manage own office | ✓ | ✓ | ✓ | ✓ | | |
| Manage own team | ✓ | ✓ | ✓ | ✓ | ✓ | |
| View all people | ✓ | ✓ | | | | |
| View own office people | ✓ | ✓ | ✓ | ✓ | ✓ | |
| View own team | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Create recruits | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve commissions | ✓ | ✓ | ✓ | ✓ | | |
| Run payroll | ✓ | | | | | |
| View own data only | | | | | | ✓ |

## Usage

### API Route Protection

#### Basic Authentication

Use `withAuth()` to protect routes that require authentication:

```typescript
import { withAuth } from "@/lib/auth/route-protection";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (req, user) => {
  // user is guaranteed to be authenticated
  return NextResponse.json({ user });
});
```

#### Permission-Based Protection

Use `withPermission()` to protect routes that require specific permissions:

```typescript
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
```

### Server-Side Helpers

#### Get Current User

```typescript
import { getCurrentUser } from "@/lib/auth/get-current-user";

const user = await getCurrentUser();
if (!user) {
  // Not authenticated
}
```

#### Check Permissions

```typescript
import { hasPermission, requirePermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

if (hasPermission(user, Permission.APPROVE_COMMISSIONS)) {
  // User has permission
}

// Or throw error if permission denied
requirePermission(user, Permission.APPROVE_COMMISSIONS);
```

#### Visibility Rules

```typescript
import { canViewPerson, getVisibilityFilter } from "@/lib/auth/visibility-rules";

// Check if user can view a specific person
const canView = await canViewPerson(user, targetPersonId);

// Get filter criteria for queries
const filter = getVisibilityFilter(user);
// Returns: null (all), { officeId }, { id }, etc.
```

### Client-Side Components

#### Permission Guard

Conditionally render components based on permissions:

```tsx
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Permission } from "@/lib/permissions/types";

<PermissionGuard permission={Permission.APPROVE_COMMISSIONS}>
  <ApproveButton />
</PermissionGuard>
```

#### Role Guard

Conditionally render components based on roles:

```tsx
import { RoleGuard } from "@/components/auth/role-guard";

<RoleGuard allowedRoles={["Admin", "Regional Manager"]}>
  <AdminPanel />
</RoleGuard>
```

## Data Visibility Rules

The system automatically filters data based on user roles:

- **Admin/Regional Manager**: Can see all data (no filter)
- **Office Manager/Area Director**: Can see data from their office (`officeId = user.officeId`)
- **Team Lead**: Can see data from their office OR people who report to them
- **Sales Rep**: Can only see their own data (`id = user.id`)

### Applying Visibility Filters

```typescript
import { applyCommissionVisibilityFilter } from "@/lib/auth/visibility-rules";
import { db } from "@/lib/db";
import { commissions, people } from "@/lib/db/schema";

const user = await getCurrentUser();
const query = db.select().from(commissions).innerJoin(people, ...);
const filteredQuery = applyCommissionVisibilityFilter(user, query);
const results = await filteredQuery;
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://...
```

## User Onboarding

When a new user signs up via Clerk:

1. Clerk creates the user account
2. User is redirected to `/dashboard` (or onboarding flow)
3. The application should call `/api/auth/sync-user` to link the Clerk user to a person record
4. The person record is created or updated with the `authUserId` field

## Testing

Mock user helpers are available in `lib/auth/__tests__/test-helpers.ts`:

```typescript
import { createMockAdmin, createMockSalesRep } from "@/lib/auth/__tests__/test-helpers";

const admin = createMockAdmin();
const rep = createMockSalesRep();
```

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
