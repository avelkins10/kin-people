# Supabase Credentials

**⚠️ SECURITY WARNING: This file contains sensitive credentials. Do NOT commit to version control.**

## Project Information

- **Project Name**: [Enter your Supabase project name]
- **Project Reference**: [Enter project ref from Supabase dashboard]
- **Region**: [Enter region, e.g., US East, US West, EU West]
- **Created Date**: [Enter creation date]

## API Credentials

Navigate to **Project Settings > API** in Supabase dashboard:

### Project URL
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
\`\`\`
**Actual Value**: `[Paste your Project URL here]`

### Anon/Public Key
\`\`\`
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
\`\`\`
**Actual Value**: `[Paste your Anon Key here]`

### Service Role Key
\`\`\`
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
\`\`\`
**Actual Value**: `[Paste your Service Role Key here]`

⚠️ **IMPORTANT**: Never expose the Service Role Key client-side. It has full database access.

## Database Credentials

Navigate to **Project Settings > Database** in Supabase dashboard:

### Connection String (Standard)
\`\`\`
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
\`\`\`
**Actual Value**: `[Paste your connection string here]`

### Direct Connection String
\`\`\`
[Paste direct connection string if different from above]
\`\`\`

### Connection Pooling String (Recommended for Serverless)
\`\`\`
[Paste connection pooling string here]
\`\`\`

## Instructions

1. Copy this template file: `cp supabase-credentials.template.md supabase-credentials.md`
2. Fill in all values from your Supabase dashboard
3. Store `supabase-credentials.md` securely (password manager, encrypted storage)
4. Add `supabase-credentials.md` to `.gitignore` to prevent accidental commits
5. Keep this file separate from your codebase in a secure location

## Next Steps

After documenting credentials:
- Export Neon database using `scripts/export-neon-db.sh`
- Verify backup using `scripts/verify-backup.sh`
- Proceed to Phase 2: Database Import
