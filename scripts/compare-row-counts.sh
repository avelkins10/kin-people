#!/bin/bash

# Row Count Comparison Script (Phase 2)
# Compares row counts between Neon and Supabase databases

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${BACKUP_DIR}/row_count_comparison_${TIMESTAMP}.txt"

# Require both connections explicitly: NEON_DATABASE_URL (or first arg) and SUPABASE_DATABASE_URL (or second arg).
# Do not fall back to a single DATABASE_URL to avoid comparing Supabase to itself.
NEON_URL="${1:-$NEON_DATABASE_URL}"
SUPABASE_URL="${2:-$SUPABASE_DATABASE_URL}"

if [ -z "$NEON_URL" ]; then
    echo -e "${RED}Error: NEON_DATABASE_URL is required and must not be empty.${NC}"
    echo ""
    echo "Usage: $0 NEON_DATABASE_URL [SUPABASE_DATABASE_URL]"
    echo "  Or set NEON_DATABASE_URL and SUPABASE_DATABASE_URL in the environment."
    echo ""
    echo "Supply both connections explicitly:"
    echo "  NEON_DATABASE_URL   – Neon (source) connection, e.g. from .env.local before migration"
    echo "  SUPABASE_DATABASE_URL – Supabase (target) connection, e.g. from supabase-credentials.md"
    echo ""
    echo "Do not rely on a single DATABASE_URL; comparing the same URL (e.g. Supabase to itself) is invalid."
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    if [ -f "supabase-credentials.md" ]; then
        EXTRACTED=$(grep -E "postgresql://" supabase-credentials.md | grep -v "template\|Example" | head -1 | sed -E "s/.*(postgresql:\/\/[^[:space:]\)\`]+).*/\1/" | sed -E "s/.*\`([^`]+)\`.*/\1/")
        [ -n "$EXTRACTED" ] && SUPABASE_URL="$EXTRACTED"
    fi
    SUPABASE_URL="${SUPABASE_DATABASE_URL:-$SUPABASE_URL}"
fi

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Error: SUPABASE_DATABASE_URL is required and could not be resolved.${NC}"
    echo "Usage: $0 NEON_DATABASE_URL [SUPABASE_DATABASE_URL]"
    echo "  Or set SUPABASE_DATABASE_URL (or add connection to supabase-credentials.md)."
    exit 1
fi

# Normalize for comparison (strip trailing slashes and whitespace)
NEON_NORM=$(echo "$NEON_URL" | sed 's/[[:space:]]*$//' | sed 's#/$##')
SUPABASE_NORM=$(echo "$SUPABASE_URL" | sed 's/[[:space:]]*$//' | sed 's#/$##')
if [ "$NEON_NORM" = "$SUPABASE_NORM" ]; then
    echo -e "${RED}Error: Neon and Supabase URLs resolve to the same value.${NC}"
    echo "You must supply two different connections (Neon source and Supabase target)."
    echo "Comparing a database to itself is invalid."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Row Count Comparison: Neon vs Supabase${NC}"
echo "=============================================="
echo ""

# Query: table name and row count from pg_stat_user_tables (approximate) or use SELECT COUNT(*) for exact
# Using pg_stat_user_tables for speed; run ANALYZE on both DBs first for accuracy if needed
SQL="SELECT tablename, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo "Fetching Neon row counts..."
NEON_DATA=$(psql "$NEON_URL" -t -A -F '|' -c "$SQL" 2>/dev/null) || { echo -e "${RED}Failed to connect to Neon${NC}"; exit 1; }
echo "Fetching Supabase row counts..."
SUPABASE_DATA=$(psql "$SUPABASE_URL" -t -A -F '|' -c "$SQL" 2>/dev/null) || { echo -e "${RED}Failed to connect to Supabase${NC}"; exit 1; }

# Build associative arrays (bash 4+) or use temp files - for portability use temp files
NEON_TMP=$(mktemp)
SUPABASE_TMP=$(mktemp)
trap "rm -f $NEON_TMP $SUPABASE_TMP" EXIT
echo "$NEON_DATA" | sort -t'|' -k1 > "$NEON_TMP"
echo "$SUPABASE_DATA" | sort -t'|' -k1 > "$SUPABASE_TMP"

# All unique table names
ALL_TABLES=$( (echo "$NEON_DATA" | cut -d'|' -f1; echo "$SUPABASE_DATA" | cut -d'|' -f1) | sort -u | grep -v '^$')

printf "%-25s %12s %12s %10s %s\n" "TABLE" "NEON" "SUPABASE" "DIFF" "STATUS" | tee "$REPORT_FILE"
echo "--------------------------------------------------------------------------------" | tee -a "$REPORT_FILE"

TOTAL_NEON=0
TOTAL_SUPABASE=0
MISMATCH=0

while read -r table; do
    [ -z "$table" ] && continue
    N=$(grep "^${table}|" "$NEON_TMP" | cut -d'|' -f2 || echo "0")
    S=$(grep "^${table}|" "$SUPABASE_TMP" | cut -d'|' -f2 || echo "0")
    N=${N:-0}
    S=${S:-0}
    DIFF=$((N - S))
    TOTAL_NEON=$((TOTAL_NEON + N))
    TOTAL_SUPABASE=$((TOTAL_SUPABASE + S))
    if [ "$DIFF" -eq 0 ]; then
        STATUS="✓ Match"
        LINE=$(printf "%-25s %12s %12s %10s %s" "$table" "$N" "$S" "$DIFF" "$STATUS")
        echo -e "${GREEN}${LINE}${NC}" | tee -a "$REPORT_FILE"
    else
        STATUS="✗ Mismatch"
        MISMATCH=$((MISMATCH + 1))
        LINE=$(printf "%-25s %12s %12s %10s %s" "$table" "$N" "$S" "$DIFF" "$STATUS")
        echo -e "${RED}${LINE}${NC}" | tee -a "$REPORT_FILE"
    fi
done <<< "$ALL_TABLES"

echo "--------------------------------------------------------------------------------" | tee -a "$REPORT_FILE"
printf "%-25s %12s %12s\n" "TOTAL" "$TOTAL_NEON" "$TOTAL_SUPABASE" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE" | tee -a "$REPORT_FILE"

if [ "$MISMATCH" -gt 0 ]; then
    echo -e "${RED}Found $MISMATCH table(s) with row count mismatch.${NC}"
    exit 1
fi
echo -e "${GREEN}All row counts match.${NC}"
exit 0
