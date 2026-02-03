# Supabase Migration - Phase 2: Database Import & Validation

This document guides you through Phase 2 of the Neon to Supabase migration: importing the backup to Supabase and validating data integrity.

## Overview

Phase 2 objectives:
- Import the verified Neon backup into your Supabase database
- Verify table structure and row counts
- Compare Neon vs Supabase row counts
- Test foreign key relationships and data consistency
- Generate reports for audit and troubleshooting

Complete all verification steps before proceeding to Phase 3 (code migration).

## Prerequisites

- **Phase 1 completed** with verified backup:
  - `backups/neon_backup.sql` exists and has been verified
  - Verification script confirmed all expected tables present
- **Supabase credentials** documented in `supabase-credentials.md` (or `SUPABASE_DATABASE_URL` / `DATABASE_URL` set)
- **PostgreSQL client tools** installed (`psql` command)
  - macOS: `brew install postgresql`
  - Ubuntu/Debian: `sudo apt-get install postgresql-client`
  - Windows: [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- **Access** to both Neon (source) and Supabase (target) databases for comparison

## Step-by-Step Instructions

### Step 1: Prepare Supabase Database

1. Ensure your Supabase project is provisioned and the database is empty (or you are prepared to run a clean import that may include `DROP` statements from the backup).
2. If the backup was created with `--clean --if-exists`, running the import will drop existing objects before creating them. Confirm this is acceptable.
3. Have your Supabase connection string ready (from **Project Settings > Database** in Supabase dashboard).

### Step 2: Run Import Script

\`\`\`bash
./scripts/import-to-supabase.sh
\`\`\`

The script will:
- Load Supabase `DATABASE_URL` from `supabase-credentials.md` or environment (`SUPABASE_DATABASE_URL` or `DATABASE_URL`)
- Verify `psql` is available and `backups/neon_backup.sql` exists
- Display a masked connection string and ask for confirmation
- Run: `psql $SUPABASE_DATABASE_URL < backups/neon_backup.sql`
- Write an import log to `backups/import_log_[timestamp].txt`
- Report success (green) or failure (red)

**Set URL explicitly (optional):**
\`\`\`bash
export SUPABASE_DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres'
./scripts/import-to-supabase.sh
\`\`\`

### Step 3: Verify Import

\`\`\`bash
./scripts/verify-supabase-import.sh
\`\`\`

The script will:
- Connect to Supabase using `DATABASE_URL`
- Count tables in `public` schema and verify all expected tables exist
- List table names and row counts (from `pg_stat_user_tables`)
- Check primary keys and foreign key relationships
- Generate a report in `backups/verify_supabase_[timestamp].txt`

**Expected tables (14 in Supabase import scope):**
- Configuration: `roles`, `offices`, `teams`, `pay_plans`, `commission_rules`
- People & Org: `people`, `person_teams`, `person_pay_plans`, `person_history`
- Recruiting: `recruits`, `recruit_history`
- Deals & Commissions: `deals`, `commissions`, `commission_history`

### Step 4: Compare Row Counts

You must supply **both** connections explicitly (Neon and Supabase). The script fails if `NEON_DATABASE_URL` is missing or if both URLs resolve to the same value (e.g. comparing Supabase to itself).

\`\`\`bash
./scripts/compare-row-counts.sh NEON_DATABASE_URL [SUPABASE_DATABASE_URL]
\`\`\`

Or set both URLs and run without arguments:
\`\`\`bash
export NEON_DATABASE_URL='postgresql://...'      # Neon (source), e.g. from .env.local before migration
export SUPABASE_DATABASE_URL='postgresql://...' # Supabase (target), e.g. from supabase-credentials.md
./scripts/compare-row-counts.sh
\`\`\`

The script will:
- Query row counts from both databases (using `pg_stat_user_tables`)
- Produce a side-by-side table: Table name, Neon count, Supabase count, Difference, Status (✓ Match / ✗ Mismatch)
- Save the report to `backups/row_count_comparison_[timestamp].txt`
- Exit with error if any table has a mismatch

### Step 5: Test Data Integrity

\`\`\`bash
./scripts/test-data-integrity.sh
\`\`\`

The script will:
- **Foreign key / orphan checks**: Ensure no orphaned rows (e.g. `people.manager_id`, `person_teams.person_id`, `deals.person_id`, `commissions.deal_id`, `recruits.recruiter_id`, etc.)
- **Sample queries**: Count people, deals, commissions, recruits; deals with commissions; recruits with recruiter
- **Org snapshots**: Count and basic JSON presence
- **Activity log**: Row count
- Write results to `backups/data_integrity_[timestamp].txt`

### Step 6: Review Reports

Review all generated reports in `backups/`:
- `import_log_[timestamp].txt` – Import stdout/stderr
- `verify_supabase_[timestamp].txt` – Table list, row counts, PKs/FKs
- `row_count_comparison_[timestamp].txt` – Neon vs Supabase comparison
- `data_integrity_[timestamp].txt` – Integrity test results

Resolve any errors or mismatches before moving to Phase 3.

## Manual Import Instructions

If you prefer not to use the import script:

### Using Supabase SQL Editor

1. Open **Supabase Dashboard > SQL Editor**.
2. For smaller backups: open `backups/neon_backup.sql` in a text editor, copy contents, paste into the SQL Editor, and click **Run**.
3. For large files, use **Run SQL** with a file upload if supported, or use `psql` (recommended).

### Using psql Directly

\`\`\`bash
# Set your Supabase connection string
export SUPABASE_DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres'

# Run import
psql "$SUPABASE_DATABASE_URL" < backups/neon_backup.sql
\`\`\`

### Handling Large Backup Files

- If the backup is very large, consider splitting the SQL file (e.g. by table or by statement type) and running chunks in order.
- Use `psql` from a machine with good network connectivity to Supabase to avoid timeouts.
- Ensure `statement_timeout` and `idle_in_transaction_session_timeout` in Supabase are sufficient for long-running imports.

## Troubleshooting

### Import Fails with Permission Errors

- **Cause**: User in the connection string may not have `CREATE`/`DROP` rights.
- **Fix**: Use the **postgres** user or a role with full schema rights. Supabase’s default connection string uses the `postgres` user; ensure the password is correct.

### Row Count Mismatches

- **Cause**: Import incomplete, or `pg_stat_user_tables` not yet updated.
- **Fix**: Run `ANALYZE;` on the Supabase database, then re-run `compare-row-counts.sh`. If mismatch persists, re-import and check the import log for errors.

### Foreign Key Constraint Violations

- **Cause**: Backup order of tables or data may not match dependency order; or duplicate/conflicting data.
- **Fix**: Ensure the backup was created with `pg_dump` without `--disable-triggers`. If the backup uses `COPY` with a specific order, re-export from Neon and re-import. Resolve any duplicate keys or invalid references in the source data.

### Connection Timeout Issues

- **Cause**: Large import or slow network.
- **Fix**: Run the import from a machine closer to the Supabase region, or increase timeout in Supabase (Project Settings > Database). For very large backups, split the file and run in sections.

### Large File Import Optimization

- Run import during low-traffic periods.
- Use a stable network; avoid VPN drops.
- Consider temporarily increasing Supabase compute resources if on a paid plan.
- Use `psql` with `-v ON_ERROR_STOP=1` to stop on first error (script already runs import in a way that captures errors).

## Verification Checklist

Before proceeding to Phase 3, confirm:

- [ ] All 14 expected tables imported successfully
- [ ] Row counts match between Neon and Supabase (compare-row-counts.sh)
- [ ] Foreign key relationships intact (verify-supabase-import.sh and test-data-integrity.sh)
- [ ] Sample queries return expected results (test-data-integrity.sh)
- [ ] No errors in the import log
- [ ] Data integrity tests pass

## Next Steps

After all checks pass:
- Proceed to **Phase 3: Code Migration** (application connection string and any Neon-specific code changes).
- Keep Neon read-only or retain it until Phase 3 is validated in production.

## Files Created in Phase 2

- `scripts/import-to-supabase.sh` – Import backup to Supabase
- `scripts/verify-supabase-import.sh` – Verify Supabase table list and structure
- `scripts/compare-row-counts.sh` – Compare Neon vs Supabase row counts
- `scripts/test-data-integrity.sh` – Test relationships and data consistency
- `MIGRATION-PHASE2.md` – This guide

## Security Notes

- Do not commit `supabase-credentials.md` or any file containing real connection strings.
- Import logs may contain no sensitive data if the backup has no credentials; still store logs in a safe place.
- Use the same credential hygiene as in Phase 1 for Supabase URLs and keys.
