#!/bin/bash

# Neon Database Export Script
# Exports complete Neon Postgres database to SQL backup file

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/neon_backup.sql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE_TIMESTAMPED="${BACKUP_DIR}/neon_backup_${TIMESTAMP}.sql"

echo -e "${GREEN}Neon Database Export Script${NC}"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL environment variable not set${NC}"
    echo "Attempting to load from .env.local..."
    
    if [ -f ".env.local" ]; then
        # Extract DATABASE_URL from .env.local
        export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)
        
        if [ -z "$DATABASE_URL" ]; then
            echo -e "${RED}Error: DATABASE_URL not found in .env.local${NC}"
            echo "Please set DATABASE_URL environment variable or update .env.local"
            exit 1
        fi
    else
        echo -e "${RED}Error: .env.local file not found${NC}"
        echo "Please set DATABASE_URL environment variable:"
        echo "  export DATABASE_URL='postgresql://user:pass@host/dbname'"
        exit 1
    fi
fi

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Error: pg_dump command not found${NC}"
    echo "Please install PostgreSQL client tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}✓${NC} PostgreSQL client tools found"
echo -e "${GREEN}✓${NC} DATABASE_URL configured"
echo ""

# Display connection info (masked password)
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
echo "Database: $MASKED_URL"
echo "Backup file: $BACKUP_FILE"
echo "Timestamped backup: $BACKUP_FILE_TIMESTAMPED"
echo ""

# Confirm before proceeding
read -p "Proceed with database export? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Export cancelled."
    exit 0
fi

echo ""
echo "Starting database export..."
echo ""

# Export database with comprehensive options
pg_dump \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --verbose \
    "$DATABASE_URL" > "$BACKUP_FILE"

# Check if export was successful
if [ $? -eq 0 ]; then
    # Get file size
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    
    echo ""
    echo -e "${GREEN}✓ Export completed successfully!${NC}"
    echo "  Backup file: $BACKUP_FILE"
    echo "  File size: $FILE_SIZE"
    
    # Create timestamped copy
    cp "$BACKUP_FILE" "$BACKUP_FILE_TIMESTAMPED"
    echo "  Timestamped copy: $BACKUP_FILE_TIMESTAMPED"
    echo ""
    
    # Quick verification
    echo "Running quick verification..."
    TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE" || echo "0")
    echo "  Tables found: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -ge 14 ]; then
        echo -e "${GREEN}✓ At least 14 tables present (verifying specifics with verify-backup.sh)${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Expected at least 14 tables, found $TABLE_COUNT${NC}"
        echo "  Run verification script for detailed analysis:"
        echo "    ./scripts/verify-backup.sh"
    fi
    
    echo ""
    echo "Next steps:"
    echo "  1. Run verification: ./scripts/verify-backup.sh"
    echo "  2. Review backup metadata: backup-metadata.txt"
    echo "  3. Store backup securely before proceeding"
    
else
    echo ""
    echo -e "${RED}✗ Export failed!${NC}"
    echo "Please check the error messages above and verify your DATABASE_URL"
    exit 1
fi
