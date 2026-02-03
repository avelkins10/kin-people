# Migration Scripts

Scripts for Neon → Supabase migration (Phase 1: backup, Phase 2: import and validation).

## Phase 1 Scripts

### export-neon-db.sh

Exports the Neon database to a SQL backup file.

**Usage:**
\`\`\`bash
./scripts/export-neon-db.sh
\`\`\`

**Requirements:**
- `DATABASE_URL` in environment or `.env.local` (Neon connection string)
- `pg_dump` installed

**Output:** `backups/neon_backup.sql` and timestamped copy.

---

### verify-backup.sh

Verifies the Neon backup file contains expected tables and basic structure.

**Usage:**
\`\`\`bash
./scripts/verify-backup.sh
\`\`\`

**Requirements:**
- `backups/neon_backup.sql` exists (run `export-neon-db.sh` first)

**Checks:** Table count, expected table names, data presence in critical tables.

---

## Phase 2 Scripts

### import-to-supabase.sh

Imports the Neon backup into the Supabase database.

**Usage:**
\`\`\`bash
export SUPABASE_DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres'
./scripts/import-to-supabase.sh
\`\`\`

Or rely on `DATABASE_URL` or `supabase-credentials.md` (see script for parsing).

**Requirements:**
- `psql` installed
- `backups/neon_backup.sql` present
- Supabase connection string set

**Output:** Import log in `backups/import_log_[timestamp].txt`.

---

### verify-supabase-import.sh

Verifies the Supabase database after import: table list, row counts, primary/foreign keys.

**Usage:**
\`\`\`bash
./scripts/verify-supabase-import.sh
\`\`\`

**Requirements:**
- Supabase `DATABASE_URL` (or `SUPABASE_DATABASE_URL`) set or in `supabase-credentials.md`
- `psql` installed

**Output:** Report in `backups/verify_supabase_[timestamp].txt`.

---

### compare-row-counts.sh

Compares row counts between Neon and Supabase for all `public` tables.

**Usage:**
\`\`\`bash
# With env vars
export NEON_DATABASE_URL='postgresql://...'
export SUPABASE_DATABASE_URL='postgresql://...'
./scripts/compare-row-counts.sh

# Or with arguments
./scripts/compare-row-counts.sh "$NEON_DATABASE_URL" "$SUPABASE_DATABASE_URL"
\`\`\`

**Requirements:**
- `psql` installed
- Access to both Neon and Supabase

**Output:** Side-by-side table and report in `backups/row_count_comparison_[timestamp].txt`. Exits with error if any table count differs.

---

### test-data-integrity.sh

Runs integrity checks on Supabase: orphan checks for main foreign keys, sample counts, basic consistency.

**Usage:**
\`\`\`bash
./scripts/test-data-integrity.sh
\`\`\`

**Requirements:**
- Supabase `DATABASE_URL` (or `SUPABASE_DATABASE_URL`) set or in `supabase-credentials.md`
- `psql` installed

**Output:** Report in `backups/data_integrity_[timestamp].txt`.

---

## Common Workflows

### Full migration (Phase 1 → Phase 2)

1. **Backup from Neon**
   \`\`\`bash
   ./scripts/export-neon-db.sh
   ./scripts/verify-backup.sh
   \`\`\`

2. **Import to Supabase**
   \`\`\`bash
   ./scripts/import-to-supabase.sh
   \`\`\`

3. **Validate**
   \`\`\`bash
   ./scripts/verify-supabase-import.sh
   ./scripts/compare-row-counts.sh   # set NEON_DATABASE_URL and SUPABASE_DATABASE_URL
   ./scripts/test-data-integrity.sh
   \`\`\`

4. Review all reports in `backups/` and complete the Phase 2 checklist in `MIGRATION-PHASE2.md`.

### Re-verify after manual import

If you imported manually (e.g. via Supabase SQL Editor or `psql`):

\`\`\`bash
./scripts/verify-supabase-import.sh
./scripts/compare-row-counts.sh
./scripts/test-data-integrity.sh
\`\`\`

---

## Troubleshooting Tips

| Issue | Suggestion |
|-------|------------|
| `psql` or `pg_dump` not found | Install PostgreSQL client tools (e.g. `brew install postgresql` on macOS). |
| DATABASE_URL not set | Set in `.env.local` or export before running. For Supabase, use `supabase-credentials.md` or `SUPABASE_DATABASE_URL`. |
| Backup file not found | Run `export-neon-db.sh` first; ensure you’re in the project root. |
| Import fails (permission/timeout) | Use postgres user URL; run from a stable network; for large backups consider splitting or increasing timeout. |
| Row count mismatch | Run `ANALYZE` on Supabase and re-run `compare-row-counts.sh`; if still wrong, check import log and re-import. |
| Integrity test failures | Fix orphaned or invalid references in source data, then re-export and re-import. |

For more detail, see `MIGRATION-PHASE1.md` and `MIGRATION-PHASE2.md`.
