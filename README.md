# Kin People App

Sales team management and commission tracking application built with Next.js, Supabase Auth, and Supabase PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS, shadcn/ui components
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository and install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in the values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Required environment variables:

\`\`\`env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

3. Set up the database:

\`\`\`bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database with initial data (roles, offices, etc.)
# Note: You'll need to create a seed script runner or use tsx
tsx lib/db/seed.ts
\`\`\`

4. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

### User Onboarding

When users sign up via Supabase Auth, they need to be linked to person records in the database. The application provides an API endpoint for this:

- `POST /api/auth/sync-user` - Links Supabase Auth user to person record (matches by email)

See `docs/authentication.md` for detailed authentication and authorization documentation.

## Database Scripts

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly (development)
- `npm run db:studio` - Open Drizzle Studio for database inspection

## Project Structure

\`\`\`
/app
  /(auth)          # Authentication pages (login, signup)
  /api             # API routes
    /auth          # Authentication endpoints
  layout.tsx       # Root layout
/components
  /auth            # Permission and role guard components
  /shared          # Shared UI components (user profile, etc.)
  /ui              # shadcn/ui components
/lib
  /auth            # Authentication helpers and utilities
  /permissions     # Permission system (types, roles)
  /db              # Database configuration and schema
/docs              # Documentation
middleware.ts      # Supabase authentication middleware
\`\`\`

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
- **SignNow:** [Document management](./docs/signnow-document-management.md) (user/admin guide). For API details (endpoints, auth, responses), use **`SignNow API.postman_collection.json`** in the project root (official SignNow API Postman collection). Use this file when implementing or debugging SignNow integration.

## License

Private project
