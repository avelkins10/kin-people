#!/bin/bash

# Supabase Import Verification Script (Phase 2)
# Validates that the Neon backup was correctly imported to Supabase

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${BACKUP_DIR}/verify_supabase_${TIMESTAMP}.txt"

# Expected tables from Supabase import scope (14 tables: Configuration, People & Org, Recruiting, Deals & Commissions)
EXPECTED_TABLES=(
    "roles"
    "offices"
    "teams"
    "pay_plans"
    "commission_rules"
    "people"
    "person_teams"
    "person_pay_plans"
    "person_history"
    "recruits"
    "recruit_history"
    "deals"
    "commissions"
    "commission_history"
)
EXPECTED_COUNT=${#EXPECTED_TABLES[@]}

# Load Supabase DATABASE_URL
if [ -n "$SUPABASE_DATABASE_URL" ]; then
    DB_URL="$SUPABASE_DATABASE_URL"
elif [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
elif [ -f "supabase-credentials.md" ]; then
    EXTRACTED=$(grep -E "postgresql://" supabase-credentials.md | grep -v "template\|Example" | head -1 | sed -E "s/.*(postgresql:\/\/[^[:space:]\)\`]+).*/\1/" | sed -E "s/.*\`([^`]+)\`.*/\1/")
    [ -n "$EXTRACTED" ] && DB_URL="$EXTRACTED"
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}Error: Supabase DATABASE_URL not set${NC}"
    echo "Export SUPABASE_DATABASE_URL or DATABASE_URL, or set in supabase-credentials.md"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    exit 1
fi

echo -e "${BLUE}Supabase Import Verification${NC}"
echo "================================"
echo ""

{
    echo "Supabase Import Verification Report"
    echo "Generated: $(date -Iseconds)"
    echo "===================================="
    echo ""

    # Total tables in public schema
    TABLE_LIST=$(psql "$DB_URL" -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null || true)
    if [ -z "$TABLE_LIST" ]; then
        echo -e "${RED}Failed to connect or no tables in public schema${NC}"
        exit 1
    fi

    ACTUAL_COUNT=$(echo "$TABLE_LIST" | grep -c . || echo "0")
    echo "Total tables in public schema: $ACTUAL_COUNT"
    echo "Expected tables: $EXPECTED_COUNT"
    echo ""

    # Use pg_stat_user_tables for row counts (may be approximate until analyzed)
    echo "Table list and row counts (from pg_stat_user_tables):"
    echo "----------------------------------------"
    ROW_COUNT_SQL="SELECT schemaname, tablename, n_live_tup AS row_count FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY tablename;"
    psql "$DB_URL" -t -A -F '|' -c "$ROW_COUNT_SQL" 2>/dev/null | while IFS='|' read -r schema name count; do
        printf "  %-25s  %s\n" "$name" "$count"
    done
    echo ""

    # Verify each expected table exists
    echo "Expected table presence:"
    echo "----------------------------------------"
    MISSING=()
    for t in "${EXPECTED_TABLES[@]}"; do
        if echo "$TABLE_LIST" | grep -qx "$t"; then
            echo "  ✓ $t"
        else
            echo "  ✗ $t (MISSING)"
            MISSING+=("$t")
        fi
    done
    echo ""

    # Primary keys check
    echo "Primary keys:"
    echo "----------------------------------------"
    psql "$DB_URL" -t -c "
        SELECT tc.table_name, string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
        GROUP BY tc.table_name
        ORDER BY tc.table_name;
    " 2>/dev/null | sed 's/^/  /' || echo "  (query skipped)"
    echo ""

    # Foreign keys check
    echo "Foreign key relationships:"
    echo "----------------------------------------"
    psql "$DB_URL" -t -c "
        SELECT tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
    " 2>/dev/null | sed 's/^/  /' || echo "  (query skipped)"
    echo ""

    # Summary
    echo "===================================="
    echo "Summary"
    echo "===================================="
    if [ ${#MISSING[@]} -eq 0 ] && [ "$ACTUAL_COUNT" -ge "$EXPECTED_COUNT" ]; then
        echo -e "${GREEN}All expected tables present. Verification PASSED.${NC}"
    else
        [ ${#MISSING[@]} -gt 0 ] && echo -e "${RED}Missing tables: ${MISSING[*]}${NC}"
        echo -e "${RED}Verification may need attention.${NC}"
    fi

} 2>&1 | tee "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"
