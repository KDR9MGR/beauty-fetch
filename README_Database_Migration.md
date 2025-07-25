# BeautyFetch Database Migration Guide

## Overview
This migration adds comprehensive database schema enhancements for all the implemented admin features, including multi-store product management, enhanced user systems, advanced order analytics, message management, and approval workflows.

## 🗄️ New Tables Created

### **1. Store Management Tables**
- **`store_hours`** - Operating hours for each store by day of week
- **`store_managers`** - Store management team assignments
- **`store_products`** - Store-specific product pricing and inventory
- **`store_analytics`** - Daily analytics data for stores
- **`commission_tracking`** - Commission calculations and payments

### **2. User Management Tables**
- **`user_addresses`** - Customer shipping and billing addresses
- **`payment_methods`** - Customer payment method information
- **`user_activity_log`** - User action tracking for security and analytics

### **3. Message System Tables**
- **`customer_messages`** - Customer support messages (separate from merchant messages)
- **`message_replies`** - Unified reply system for all message types

### **4. System Administration Tables**
- **`admin_settings`** - System configuration settings
- **`approval_survey_templates`** - Survey templates for approval workflows
- **`system_audit_log`** - Admin action audit trail

## 🔄 Enhanced Existing Tables

### **Profiles Table**
```sql
-- Added columns for user blocking and status management
- is_blocked BOOLEAN DEFAULT FALSE
- blocked_reason TEXT
- blocked_at TIMESTAMPTZ
- last_login_at TIMESTAMPTZ
- status TEXT DEFAULT 'active'
```

### **Stores Table**
```sql
-- Added columns for enhanced store management
- phone TEXT
- email TEXT
- commission_rate NUMERIC(5,2) DEFAULT 5.00
```

### **Orders Table**
```sql
-- Added columns for order archiving and fraud detection
- is_archived BOOLEAN DEFAULT FALSE
- archived_at TIMESTAMPTZ
- archived_by UUID REFERENCES profiles(id)
- fraud_risk_level TEXT DEFAULT 'low'
```

### **Merchant Messages Table**
```sql
-- Enhanced message system columns
- content TEXT
- subject TEXT
- status TEXT DEFAULT 'new'
- is_archived BOOLEAN DEFAULT FALSE
- archived_at TIMESTAMPTZ
```

### **Approval Requests Table**
```sql
-- Added survey support
- survey_results JSONB
- requested_data JSONB
```

## 📊 Created Views

### **1. Store Analytics Summary**
Provides comprehensive store performance metrics:
- Total orders and revenue
- Commission tracking
- Customer analytics
- Monthly performance

### **2. User Order Summary**
User shopping behavior and statistics:
- Order history summaries
- Spending patterns
- Account status information

### **3. Product Store Availability**
Multi-store product information:
- Price variations across stores
- Inventory totals
- Store availability counts

## 🔒 Security Features

### **Row Level Security (RLS)**
- Enabled on all new tables
- User-specific data access policies
- Admin and store owner permissions
- Public data access where appropriate

### **Audit Trail**
- System audit logging for admin actions
- User activity tracking
- Change history for critical data

## 🚀 How to Apply the Migration

### **Method 1: Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase_migration_complete.sql`
4. Paste and execute the SQL

### **Method 2: Supabase CLI**
```bash
# Make sure you're in your project root
cd beautyfetch-user

# Apply the migration
supabase db push

# Or if using migration files
supabase migration new complete_schema_enhancement
# Copy the SQL content to the new migration file
supabase db push
```

### **Method 3: Direct Database Connection**
```bash
# Using psql with your database connection string
psql "your-supabase-connection-string" -f supabase_migration_complete.sql
```

## 🔍 Verification Steps

After applying the migration, verify the changes:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'store_hours', 'store_managers', 'store_products', 
    'customer_messages', 'message_replies', 'user_addresses',
    'payment_methods', 'commission_tracking', 'admin_settings',
    'store_analytics', 'user_activity_log'
);

-- Check enhanced columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_blocked', 'blocked_reason', 'status');

-- Verify views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN (
    'store_analytics_summary', 
    'user_order_summary', 
    'product_store_availability'
);

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## 📋 Post-Migration Tasks

### **1. Update TypeScript Types**
The `src/integrations/supabase/types.ts` file has already been updated to include all new table definitions.

### **2. Default Data Population**
The migration automatically:
- ✅ Creates default store hours for existing stores
- ✅ Inserts essential admin settings
- ✅ Sets up proper indexes for performance

### **3. Test New Features**
After migration, test the following admin features:
- Multi-store product management
- Enhanced user blocking/management
- Order archiving and cost breakdown
- Message system with replies
- Store analytics dashboard
- Approval survey system

## ⚠️ Important Notes

### **Backup Recommendation**
```bash
# Create a backup before migration (recommended)
pg_dump "your-database-url" > backup_before_migration.sql
```

### **Performance Considerations**
- All tables include proper indexing
- Views are optimized for common queries
- RLS policies are efficient and minimal

### **Rollback Strategy**
If you need to rollback:
```sql
-- Drop new tables (in reverse dependency order)
DROP VIEW IF EXISTS product_store_availability CASCADE;
DROP VIEW IF EXISTS user_order_summary CASCADE;
DROP VIEW IF EXISTS store_analytics_summary CASCADE;

DROP TABLE IF EXISTS system_audit_log CASCADE;
DROP TABLE IF EXISTS approval_survey_templates CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS store_analytics CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS commission_tracking CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;
DROP TABLE IF EXISTS store_managers CASCADE;
DROP TABLE IF EXISTS message_replies CASCADE;
DROP TABLE IF EXISTS customer_messages CASCADE;
DROP TABLE IF EXISTS store_hours CASCADE;

-- Remove added columns (if needed)
-- Note: This will lose data in those columns
ALTER TABLE profiles DROP COLUMN IF EXISTS is_blocked;
-- ... repeat for other enhanced columns
```

## 🎯 Feature Mapping

This migration enables the following admin features:

| Feature | Database Support |
|---------|------------------|
| **Multi-Store Products** | `store_products` table with pricing/inventory |
| **Store Analytics** | `store_analytics` + `commission_tracking` |
| **User Management** | Enhanced `profiles` + `user_addresses` |
| **Order Management** | Enhanced `orders` + `order_cost_breakdown` |
| **Message System** | `customer_messages` + `message_replies` |
| **Approval System** | Enhanced `approval_requests` + survey templates |
| **Store Hours** | `store_hours` with day-specific schedules |
| **Commission Tracking** | `commission_tracking` with automated calculations |

## 🔧 Maintenance

### **Regular Tasks**
```sql
-- Clean up old activity logs (run monthly)
DELETE FROM user_activity_log 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Update store analytics (run daily via cron)
INSERT INTO store_analytics (store_id, date, total_orders, total_revenue)
SELECT store_id, CURRENT_DATE, COUNT(*), SUM(total_amount)
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at::date = CURRENT_DATE
GROUP BY store_id
ON CONFLICT (store_id, date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue;
```

## ✅ Success Indicators

After successful migration, you should see:
- ✅ All new admin features working properly
- ✅ No existing functionality broken
- ✅ Performance remains optimal
- ✅ All data properly secured with RLS
- ✅ Analytics dashboards displaying data

## 🆘 Support

If you encounter issues:
1. Check the verification steps above
2. Review Supabase logs for any errors
3. Ensure your database user has sufficient permissions
4. Verify network connectivity to your database

The migration is designed to be safe and non-destructive to existing data while adding all the necessary enhancements for the complete admin feature set. 