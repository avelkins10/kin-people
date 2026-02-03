# Supabase Migration - Phase 1: Infrastructure Setup & Data Backup

This document guides you through Phase 1 of the Neon to Supabase migration, focusing on infrastructure setup and complete data backup.

## Overview

Phase 1 ensures data safety by creating a complete backup of your Neon database before any code changes occur. This phase includes:
- Creating a Supabase project
- Documenting Supabase credentials
- Exporting the complete Neon database
- Verifying backup integrity
- Creating backup metadata

## Prerequisites

- PostgreSQL client tools installed (`pg_dump` command)
  - macOS: `brew install postgresql`
  - Ubuntu/Debian: `sudo apt-get install postgresql-client`
  - Windows: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Access to Neon database (DATABASE_URL from `.env.local` or Neon dashboard)
- Supabase account (create at [supabase.com](https://supabase.com))

## Step-by-Step Instructions

### Step 1: Create Supabase Project

1. Navigate to [https://supabase.com](https://supabase.com)
2. Sign in or create a Supabase account
3. Click **"New Project"** from the dashboard
4. Configure project settings:
   - **Project Name**: Choose a descriptive name (e.g., "kin-people-app-production")
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Select the same region as your current Neon database
     - Check your Neon dashboard for region information
     - Common regions: US East, US West, EU West
   - **Pricing Plan**: Select appropriate plan based on your needs
5. Wait for project provisioning to complete (typically 2-3 minutes)

### Step 2: Document Supabase Credentials

1. Copy the credentials template:
   \`\`\`bash
   cp supabase-credentials.template.md supabase-credentials.md
   \`\`\`

2. Navigate to **Project Settings > API** in Supabase dashboard:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

3. Navigate to **Project Settings > Database** in Supabase dashboard:
   - Copy **Connection String** → `DATABASE_URL`
   - Optionally copy **Connection Pooling String** for serverless environments

4. Fill in all values in `supabase-credentials.md`

5. Store `supabase-credentials.md` securely:
   - Password manager
   - Encrypted file storage
   - Secure notes application
   - **DO NOT** commit to version control (already in `.gitignore`)

### Step 3: Export Neon Database

Run the export script to create a complete backup:

\`\`\`bash
./scripts/export-neon-db.sh
\`\`\`

The script will:
- Check for `DATABASE_URL` in environment or `.env.local`
- Verify `pg_dump` is installed
- Export database with comprehensive options:
  - `--clean`: Include DROP statements
  - `--if-exists`: Use IF EXISTS with DROP
  - `--no-owner`: Don't output ownership commands
  - `--no-acl`: Don't output access privileges
- Save backup to `./backups/neon_backup.sql`
- Create timestamped copy for redundancy

**Manual Export (Alternative):**

If you prefer to run `pg_dump` manually:

\`\`\`bash
# Set DATABASE_URL if not in .env.local
export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# Create backups directory
mkdir -p backups

# Export database
pg_dump --clean --if-exists --no-owner --no-acl $DATABASE_URL > backups/neon_backup.sql
\`\`\`

### Step 4: Verify Backup Integrity

Run the verification script:

\`\`\`bash
./scripts/verify-backup.sh
\`\`\`

The script verifies:
- ✅ Backup file exists and is non-empty
- ✅ All 14 expected tables are present
- ✅ Data presence in critical tables (people, roles, deals, commissions, org_snapshots, activity_log)
- ✅ No errors or warnings in backup file
- ✅ Lists all tables found

**Expected Tables (14 total):**

| Category | Tables |
|----------|--------|
| Configuration | `roles`, `offices`, `teams`, `pay_plans`, `commission_rules` |
| People & Organization | `people`, `person_teams`, `person_pay_plans`, `person_history`, `org_snapshots` |
| Recruiting | `recruits` |
| Deals & Commissions | `deals`, `commissions` |
| Audit | `activity_log` |

**Manual Verification (Alternative):**

\`\`\`bash
# Check file size
ls -lh backups/neon_backup.sql

# Count tables
grep -c "CREATE TABLE" backups/neon_backup.sql
# Expected: 14

# List all tables
grep "CREATE TABLE" backups/neon_backup.sql | sed 's/CREATE TABLE //' | sed 's/ (//'

# Check for data
grep "COPY people" backups/neon_backup.sql
grep "COPY roles" backups/neon_backup.sql
grep "COPY deals" backups/neon_backup.sql
grep "COPY org_snapshots" backups/neon_backup.sql
grep "COPY activity_log" backups/neon_backup.sql
\`\`\`

### Step 5: Create Backup Metadata

1. Copy the metadata template:
   \`\`\`bash
   cp backup-metadata.template.txt backup-metadata.txt
   \`\`\`

2. Fill in the metadata:
   - Backup date and time
   - File size
   - Source database region
   - Supabase project name
   - Verification status
   - Any relevant notes

3. Store `backup-metadata.txt` alongside the backup file

**Optional: Get Row Counts from Neon**

Before backup, you can get row counts:

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
\`\`\`

Add these counts to the metadata file for reference.

### Step 6: Secure Backup Storage

**Critical**: Store backups securely before proceeding:

1. **Primary Storage**: Keep `backups/neon_backup.sql` in a secure location
2. **Redundancy**: Create multiple copies in different locations:
   - Encrypted cloud storage (AWS S3, Google Cloud Storage, etc.)
   - Encrypted local storage
   - Secure backup service
3. **Compression** (Optional): Compress to save space:
   \`\`\`bash
   gzip backups/neon_backup.sql
   # Creates: backups/neon_backup.sql.gz
   \`\`\`
4. **Version Control**: **DO NOT** commit backup files to public repositories
   - Backup files are already in `.gitignore`
   - Use encrypted storage for backup files

## Deliverables Checklist

Before proceeding to Phase 2, ensure all items are complete:

- [ ] Supabase project created and provisioned
- [ ] Supabase credentials documented in `supabase-credentials.md`
  - [ ] Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
  - [ ] Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - [ ] Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
  - [ ] Database URL (`DATABASE_URL`)
- [ ] Neon database exported to `backups/neon_backup.sql`
- [ ] Backup file verified to contain all 14 user-specified tables
- [ ] Backup metadata document created (`backup-metadata.txt`)
- [ ] Backup stored securely with redundancy
- [ ] Verification script confirms backup integrity

## Troubleshooting

### pg_dump Not Found

**Error**: `pg_dump: command not found`

**Solution**: Install PostgreSQL client tools:
- macOS: `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`
- Windows: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### DATABASE_URL Not Set

**Error**: `DATABASE_URL environment variable is not set`

**Solution**: 
1. Check `.env.local` file exists and contains `DATABASE_URL`
2. Or set environment variable: `export DATABASE_URL="postgresql://..."`

### Backup File Empty

**Error**: Backup file is 0 bytes

**Solution**:
1. Verify DATABASE_URL is correct
2. Check network connectivity to Neon database
3. Verify database credentials are valid
4. Check Neon dashboard for connection issues

### Missing Tables in Backup

**Error**: Verification shows fewer than 14 tables

**Solution**:
1. Verify you're connected to the correct database
2. Check if all tables exist in Neon database
3. Re-run export with verbose flag: `pg_dump --verbose ...`
4. Check Neon dashboard for any schema issues

## Next Steps

Once Phase 1 is complete:
- ✅ All deliverables checked off
- ✅ Backup verified and stored securely
- ✅ Supabase credentials documented

Proceed to **Phase 2: Database Import** to import the backup into Supabase.

## Files Created

- `supabase-credentials.template.md` - Template for documenting Supabase credentials
- `scripts/export-neon-db.sh` - Automated database export script
- `scripts/verify-backup.sh` - Backup verification script
- `backup-metadata.template.txt` - Template for backup metadata
- `MIGRATION-PHASE1.md` - This guide

## Security Notes

- ⚠️ Never commit backup files or credentials to version control
- ⚠️ Store credentials in secure, encrypted storage
- ⚠️ Keep multiple backup copies in different locations
- ⚠️ Service Role Key has full database access - never expose client-side
- ⚠️ Use connection pooling string for production serverless environments
