#!/bin/bash

# Secure Database Migration Script for BeautyFetch
# This script creates backups and applies the migration safely

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="ysmzgrtfxbtqkaeltoug.supabase.co"  # Updated host without 'db.' prefix
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"
BACKUP_DIR="database_backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 BeautyFetch Database Migration Script${NC}"
echo "======================================"

# Check if password is provided
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: SUPABASE_DB_PASSWORD environment variable not set${NC}"
    echo "Please set your database password:"
    echo "export SUPABASE_DB_PASSWORD='your_actual_password'"
    echo "Then run this script again."
    exit 1
fi

# Construct connection string with SSL mode
CONNECTION_STRING="postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo -e "${YELLOW}📋 Migration Plan:${NC}"
echo "1. Create full database backup"
echo "2. Create schema-only backup" 
echo "3. Apply migration (supabase_migration_complete.sql)"
echo "4. Verify migration success"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${BLUE}📁 Created backup directory: $BACKUP_DIR${NC}"

# Step 1: Create full database backup
echo -e "${YELLOW}⬇️  Creating full database backup...${NC}"
if pg_dump "$CONNECTION_STRING" > "$BACKUP_DIR/beautyfetch_full_backup.sql"; then
    echo -e "${GREEN}✅ Full backup created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create full backup${NC}"
    exit 1
fi

# Step 2: Create schema-only backup
echo -e "${YELLOW}⬇️  Creating schema-only backup...${NC}"
if pg_dump --schema-only "$CONNECTION_STRING" > "$BACKUP_DIR/beautyfetch_schema_backup.sql"; then
    echo -e "${GREEN}✅ Schema backup created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create schema backup${NC}"
    exit 1
fi

# Step 3: Apply migration
echo -e "${YELLOW}🔄 Applying migration (supabase_migration_complete.sql)...${NC}"
if psql "$CONNECTION_STRING" -f supabase_migration_complete.sql; then
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo -e "${YELLOW}💡 You can restore from backup: $BACKUP_DIR/beautyfetch_full_backup.sql${NC}"
    exit 1
fi

# Step 4: Verify migration
echo -e "${YELLOW}🔍 Verifying migration...${NC}"

# Check if key tables exist
TABLES_TO_CHECK=(
    "customer_messages"
    "message_replies"
    "store_hours"
    "store_managers" 
    "store_products"
    "user_addresses"
    "payment_methods"
    "commission_tracking"
    "admin_settings"
    "store_analytics"
)

echo -e "${BLUE}Checking new tables:${NC}"
for table in "${TABLES_TO_CHECK[@]}"; do
    if psql "$CONNECTION_STRING" -c "\d $table" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $table${NC}"
    else
        echo -e "${RED}❌ $table${NC}"
    fi
done

# Check views
echo -e "${BLUE}Checking new views:${NC}"
VIEWS_TO_CHECK=(
    "store_analytics_summary"
    "user_order_summary"
    "product_store_availability"
)

for view in "${VIEWS_TO_CHECK[@]}"; do
    if psql "$CONNECTION_STRING" -c "\d $view" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $view${NC}"
    else
        echo -e "${RED}❌ $view${NC}"
    fi
done

# Final summary
echo ""
echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo "• Backup location: $BACKUP_DIR"
echo "• Full backup: beautyfetch_full_backup.sql"
echo "• Schema backup: beautyfetch_schema_backup.sql"
echo "• Migration file: supabase_migration_complete.sql"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test admin features in your application"
echo "2. Verify all new tables have data populated correctly"
echo "3. Check that existing functionality still works"
echo ""
echo -e "${GREEN}🔒 Backup available for rollback if needed${NC}" 