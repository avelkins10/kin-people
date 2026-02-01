#!/bin/bash

# Backup Verification Script
# Verifies the integrity of the Neon database backup

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

# Expected tables (14 specific + possible others like history tables)
declare -a EXPECTED_TABLES=(
    "people"
    "roles"
    "offices"
    "teams"
    "pay_plans"
    "commission_rules"
    "recruits"
    "deals"
    "commissions"
    "person_history"
    "person_pay_plans"
    "person_teams"
    "org_snapshots"
    "activity_log"
)

echo -e "${BLUE}Neon Database Backup Verification${NC}"
echo "======================================"
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    echo "Please run the export script first: ./scripts/export-neon-db.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} Backup file found: $BACKUP_FILE"
echo ""

# Get file size
FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
FILE_SIZE_BYTES=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
echo "File size: $FILE_SIZE ($FILE_SIZE_BYTES bytes)"

if [ "$FILE_SIZE_BYTES" -eq 0 ]; then
    echo -e "${RED}✗ Error: Backup file is empty!${NC}"
    exit 1
fi

echo ""

# Count CREATE TABLE statements
TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE" || echo "0")
echo "Total CREATE TABLE statements: $TABLE_COUNT"

if [ "$TABLE_COUNT" -lt 14 ]; then
    echo -e "${YELLOW}⚠ Warning: Expected at least 14 tables, found $TABLE_COUNT${NC}"
else
    echo -e "${GREEN}✓ At least 14 tables present (found $TABLE_COUNT total)${NC}"
fi

echo ""
echo "Verifying individual tables..."
echo ""

# Verify each expected table
MISSING_TABLES=()
FOUND_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
    if grep -q "CREATE TABLE.*\"$table\"" "$BACKUP_FILE" || grep -q "CREATE TABLE.*$table " "$BACKUP_FILE"; then
        echo -e "  ${GREEN}✓${NC} $table"
        FOUND_TABLES+=("$table")
    else
        echo -e "  ${RED}✗${NC} $table (NOT FOUND)"
        MISSING_TABLES+=("$table")
    fi
done

echo ""

# Check for data presence in critical tables
echo "Checking data presence in critical tables..."
echo ""

CRITICAL_TABLES=("people" "roles" "deals" "commissions" "org_snapshots" "activity_log")
for table in "${CRITICAL_TABLES[@]}"; do
    if grep -q "COPY.*\"$table\"" "$BACKUP_FILE" || grep -q "COPY.*$table " "$BACKUP_FILE"; then
        # Try to count rows (approximate)
        ROW_COUNT=$(grep -A 1000 "COPY.*\"$table\"" "$BACKUP_FILE" | grep -c "^[0-9]" || echo "0")
        if [ "$ROW_COUNT" -gt 0 ]; then
            echo -e "  ${GREEN}✓${NC} $table: Data present (~$ROW_COUNT rows)"
        else
            echo -e "  ${YELLOW}⚠${NC} $table: Table structure found, but no data detected"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} $table: No COPY statement found"
    fi
done

echo ""

# Check for errors or warnings
echo "Checking for errors or warnings..."
ERRORS=$(grep -i "error\|warning" "$BACKUP_FILE" | head -5 || true)
if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✓${NC} No errors or warnings found in backup file"
else
    echo -e "${YELLOW}⚠${NC} Found potential issues:"
    echo "$ERRORS" | while read -r line; do
        echo "  $line"
    done
fi

echo ""

# List all table names found
echo "All tables found in backup:"
grep "CREATE TABLE" "$BACKUP_FILE" | sed 's/CREATE TABLE //' | sed 's/ (.*//' | sed 's/"//g' | sort | while read -r table; do
    echo "  - $table"
done

echo ""

# Summary
echo "======================================"
echo "Verification Summary"
echo "======================================"

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All expected tables present${NC}"
    echo -e "${GREEN}✓ Backup file size: $FILE_SIZE${NC}"
    echo -e "${GREEN}✓ Backup appears to be complete${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review backup-metadata.txt"
    echo "  2. Store backup securely"
    echo "  3. Proceed to Phase 2: Database Import"
    exit 0
else
    echo -e "${RED}✗ Missing tables: ${MISSING_TABLES[*]}${NC}"
    echo -e "${YELLOW}⚠ Backup may be incomplete${NC}"
    echo ""
    echo "Please re-run the export script and verify your database connection."
    exit 1
fi
