#!/bin/bash

# Supabase Import Script (Phase 2)
# Imports Neon backup to Supabase database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/neon_backup.sql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${BACKUP_DIR}/import_log_${TIMESTAMP}.txt"

echo -e "${GREEN}Supabase Import Script (Phase 2)${NC}"
echo "================================"
echo ""

# Load Supabase DATABASE_URL: prefer SUPABASE_DATABASE_URL, then DATABASE_URL, then supabase-credentials.md
if [ -n "$SUPABASE_DATABASE_URL" ]; then
    export SUPABASE_DATABASE_URL
elif [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Using DATABASE_URL (ensure this is your Supabase connection string)${NC}"
    SUPABASE_DATABASE_URL="$DATABASE_URL"
elif [ -f "supabase-credentials.md" ]; then
    echo "Attempting to load DATABASE_URL from supabase-credentials.md..."
    EXTRACTED=$(grep -E "postgresql://|DATABASE_URL" supabase-credentials.md | grep -v "template\|Example\|^\s*#" | head -1 | sed -E "s/.*(postgresql:\/\/[^[:space:]\)\`]+).*/\1/" | sed -E "s/.*\`([^`]+)\`.*/\1/")
    if [ -n "$EXTRACTED" ]; then
        SUPABASE_DATABASE_URL="$EXTRACTED"
        echo -e "${GREEN}✓${NC} Loaded connection string from supabase-credentials.md"
    fi
fi

if [ -z "$SUPABASE_DATABASE_URL" ]; then
    echo -e "${RED}Error: Supabase DATABASE_URL not set${NC}"
    echo "Set one of:"
    echo "  export SUPABASE_DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres'"
    echo "  export DATABASE_URL='...'  (Supabase connection string)"
    echo "Or add connection string to supabase-credentials.md (Database section)"
    exit 1
fi

# Verify psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found${NC}"
    echo "Install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    exit 1
fi

# Check backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    echo "Run Phase 1 export first: ./scripts/export-neon-db.sh"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# Mask password in connection string for display
MASKED_URL=$(echo "$SUPABASE_DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
echo -e "${GREEN}✓${NC} psql found"
echo -e "${GREEN}✓${NC} Backup file found: $BACKUP_FILE"
echo "Connection (masked): $MASKED_URL"
echo "Import log will be written to: $LOG_FILE"
echo ""

read -p "Proceed with import to Supabase? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Import cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting import...${NC}"
START_TIME=$(date +%s)

if psql "$SUPABASE_DATABASE_URL" < "$BACKUP_FILE" > "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "" >> "$LOG_FILE"
    echo "Import completed at $(date -Iseconds). Duration: ${DURATION}s" >> "$LOG_FILE"
    echo ""
    echo -e "${GREEN}✓ Import completed successfully!${NC}"
    echo "  Duration: ${DURATION}s"
    echo "  Log file: $LOG_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Verify import: ./scripts/verify-supabase-import.sh"
    echo "  2. Compare row counts: ./scripts/compare-row-counts.sh"
    echo "  3. Test data integrity: ./scripts/test-data-integrity.sh"
    exit 0
else
    END_TIME=$(date +%s)
    echo "" >> "$LOG_FILE"
    echo "Import failed at $(date -Iseconds)" >> "$LOG_FILE"
    echo ""
    echo -e "${RED}✗ Import failed!${NC}"
    echo "Check log file: $LOG_FILE"
    tail -20 "$LOG_FILE" | while read -r line; do echo "  $line"; done
    exit 1
fi
