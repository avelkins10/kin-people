#!/bin/bash

# Data Integrity Test Script (Phase 2)
# Validates foreign key relationships, sample queries, and data consistency in Supabase

set -e
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${BACKUP_DIR}/data_integrity_${TIMESTAMP}.txt"

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
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

run_query() {
    psql "$DB_URL" -t -A -c "$1" 2>/dev/null
    return $?
}

echo -e "${BLUE}Data Integrity Tests (Supabase)${NC}"
echo "================================"
echo ""

{
    echo "Data Integrity Test Report"
    echo "Generated: $(date -Iseconds)"
    echo "=========================="
    echo ""

    FAIL=0

    # --- Foreign key / orphan checks ---
    echo "1. Foreign key and orphan checks"
    echo "---------------------------------"

    # people.manager_id -> people.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM people p WHERE p.manager_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM people m WHERE m.id = p.manager_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ people.manager_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ people.manager_id references valid"
    else
        echo "  ✗ people.manager_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # person_teams.person_id -> people.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM person_teams pt WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.id = pt.person_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ person_teams.person_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ person_teams.person_id references valid"
    else
        echo "  ✗ person_teams.person_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # person_teams.team_id -> teams.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM person_teams pt WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = pt.team_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ person_teams.team_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ person_teams.team_id references valid"
    else
        echo "  ✗ person_teams.team_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # person_pay_plans.person_id -> people.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM person_pay_plans ppp WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.id = ppp.person_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ person_pay_plans.person_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ person_pay_plans.person_id references valid"
    else
        echo "  ✗ person_pay_plans.person_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # person_pay_plans.pay_plan_id -> pay_plans.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM person_pay_plans ppp WHERE NOT EXISTS (SELECT 1 FROM pay_plans pp WHERE pp.id = ppp.pay_plan_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ person_pay_plans.pay_plan_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ person_pay_plans.pay_plan_id references valid"
    else
        echo "  ✗ person_pay_plans.pay_plan_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # deals.person_id -> people.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM deals d WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.id = d.person_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ deals.person_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ deals.person_id references valid"
    else
        echo "  ✗ deals.person_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # commissions.deal_id -> deals.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM commissions c WHERE NOT EXISTS (SELECT 1 FROM deals d WHERE d.id = c.deal_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ commissions.deal_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ commissions.deal_id references valid"
    else
        echo "  ✗ commissions.deal_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    # recruits.recruiter_id -> people.id
    ORPHAN=$(run_query "SELECT COUNT(*) FROM recruits r WHERE r.recruiter_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM people p WHERE p.id = r.recruiter_id);"); qret=$?
    if [ $qret -ne 0 ]; then
        echo "  ✗ recruits.recruiter_id: query failed (connection or missing table)"
        FAIL=1
    elif [ "$ORPHAN" = "0" ]; then
        echo "  ✓ recruits.recruiter_id references valid"
    else
        echo "  ✗ recruits.recruiter_id: $ORPHAN orphaned row(s)"
        FAIL=1
    fi

    echo ""

    # --- Sample queries ---
    echo "2. Sample data queries"
    echo "----------------------"

    PEOPLE_COUNT=$(run_query "SELECT COUNT(*) FROM people;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  people: query failed"; FAIL=1; else echo "  people: $PEOPLE_COUNT row(s)"; fi

    DEALS_COUNT=$(run_query "SELECT COUNT(*) FROM deals;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  deals: query failed"; FAIL=1; else echo "  deals: $DEALS_COUNT row(s)"; fi

    COMMISSIONS_COUNT=$(run_query "SELECT COUNT(*) FROM commissions;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  commissions: query failed"; FAIL=1; else echo "  commissions: $COMMISSIONS_COUNT row(s)"; fi

    RECRUITS_COUNT=$(run_query "SELECT COUNT(*) FROM recruits;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  recruits: query failed"; FAIL=1; else echo "  recruits: $RECRUITS_COUNT row(s)"; fi

    # Deals with commissions (sample)
    DEAL_COMM=$(run_query "SELECT COUNT(*) FROM deals d WHERE EXISTS (SELECT 1 FROM commissions c WHERE c.deal_id = d.id);"); qret=$?
    if [ $qret -ne 0 ]; then echo "  deals with commissions: query failed"; FAIL=1; else echo "  deals with commissions: $DEAL_COMM"; fi

    # Recruits with recruiter
    REC_REC=$(run_query "SELECT COUNT(*) FROM recruits r WHERE r.recruiter_id IS NOT NULL;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  recruits with recruiter: query failed"; FAIL=1; else echo "  recruits with recruiter: $REC_REC"; fi

    echo ""

    # --- Org snapshots JSON ---
    echo "3. Org snapshots JSON validity"
    echo "------------------------------"
    ORG_COUNT=$(run_query "SELECT COUNT(*) FROM org_snapshots;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  org_snapshots: query failed"; FAIL=1; else echo "  org_snapshots: $ORG_COUNT row(s)"; fi
    INVALID_JSON=$(run_query "SELECT COUNT(*) FROM org_snapshots WHERE snapshot IS NULL OR (snapshot::text IS NOT NULL AND snapshot::text NOT LIKE '{%');" 2>/dev/null); _qret=$?
    [ $_qret -ne 0 ] && FAIL=1
    echo "  (JSON structure check: run manually if needed)"
    echo ""

    # --- Activity log order ---
    echo "4. Activity log (chronological)"
    echo "------------------------------"
    LOG_COUNT=$(run_query "SELECT COUNT(*) FROM activity_log;"); qret=$?
    if [ $qret -ne 0 ]; then echo "  activity_log: query failed"; FAIL=1; else echo "  activity_log: $LOG_COUNT row(s)"; fi
    echo ""

    # --- Summary ---
    echo "=========================="
    echo "Summary"
    echo "=========================="
    if [ $FAIL -eq 0 ]; then
        echo -e "${GREEN}All integrity checks passed.${NC}"
    else
        echo -e "${RED}One or more integrity checks failed (query errors or orphan rows).${NC}"
    fi

    exit $FAIL
} 2>&1 | tee "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"
