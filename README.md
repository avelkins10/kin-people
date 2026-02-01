# Kin People App

Sales team management and commission tracking application built with Next.js, Clerk authentication, and Neon Postgres.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Authentication**: Clerk
- **Database**: Neon Postgres with Drizzle ORM
- **UI**: Tailwind CSS, shadcn/ui components
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon Postgres database
- Clerk account and application

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required environment variables:

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
```

3. Set up the database:

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database with initial data (roles, offices, etc.)
# Note: You'll need to create a seed script runner or use tsx
tsx lib/db/seed.ts
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

### Clerk Configuration

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key to `.env.local`
4. Configure the following URLs in Clerk dashboard:
   - Sign-in URL: `/login`
   - Sign-up URL: `/signup`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### User Onboarding

When users sign up via Clerk, they need to be linked to person records in the database. The application provides an API endpoint for this:

- `POST /api/auth/sync-user` - Links Clerk user to person record

See `docs/authentication.md` for detailed authentication and authorization documentation.

## Database Scripts

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly (development)
- `npm run db:studio` - Open Drizzle Studio for database inspection

## Project Structure

```
/app
  /(auth)          # Authentication pages (login, signup)
  /api             # API routes
    /auth          # Authentication endpoints
  layout.tsx       # Root layout with ClerkProvider
/components
  /auth            # Permission and role guard components
  /shared          # Shared UI components (user profile, etc.)
  /ui              # shadcn/ui components
/lib
  /auth            # Authentication helpers and utilities
  /permissions     # Permission system (types, roles)
  /db              # Database configuration and schema
/docs              # Documentation
middleware.ts      # Clerk authentication middleware
```

## Authentication & Authorization

The application implements a comprehensive role-based access control (RBAC) system:

- **Roles**: Admin, Regional Manager, Office Manager, Area Director, Team Lead, Sales Rep
- **Permissions**: Granular permissions for actions and data access
- **Visibility Rules**: Automatic data filtering based on role hierarchy

See `docs/authentication.md` for complete documentation on:
- Permission system architecture
- Using `withAuth` and `withPermission` in API routes
- Permission guards in UI components
- Data visibility rules

## Development

### Adding New Permissions

1. Add the permission to `lib/permissions/types.ts` (Permission enum)
2. Update `lib/permissions/roles.ts` to assign permissions to roles
3. Use the permission in API routes with `withPermission()`
4. Use `PermissionGuard` component in UI

### Adding New Roles

1. Add role to database seed (`lib/db/seed.ts`)
2. Add role permissions to `lib/permissions/roles.ts`
3. Update visibility rules if needed (`lib/auth/visibility-rules.ts`)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

- [Authentication & Authorization](./docs/authentication.md) - Complete auth system documentation

## License

Private project
