-- Comprehensive Database Migration for BeautyFetch Platform
-- This migration adds all missing tables and updates existing schema for the enhanced admin features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to existing tables

-- Update profiles table to support user blocking and enhanced info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'blocked'));

-- Update stores table to support enhanced store management
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 5.00;

-- Update orders table for enhanced order management
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fraud_risk_level TEXT DEFAULT 'low' CHECK (fraud_risk_level IN ('low', 'medium', 'high', 'critical'));

-- Update merchant_messages table for enhanced message system
ALTER TABLE merchant_messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE merchant_messages ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE merchant_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'replied', 'resolved'));
ALTER TABLE merchant_messages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE merchant_messages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Update approval_requests table
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS survey_results JSONB;
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS requested_data JSONB;

-- Create customer_messages table (separate from merchant_messages)
CREATE TABLE IF NOT EXISTS customer_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'replied', 'resolved')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message_replies table for both customer and merchant messages
CREATE TABLE IF NOT EXISTS message_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL, -- References either customer_messages or merchant_messages
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'customer', 'merchant')),
    sender_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_hours table for store operating hours
CREATE TABLE IF NOT EXISTS store_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, day_of_week)
);

-- Create store_managers table for store management team
CREATE TABLE IF NOT EXISTS store_managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'manager' CHECK (role IN ('manager', 'assistant_manager', 'supervisor')),
    permissions JSONB DEFAULT '{}',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, user_id)
);

-- Create store_products table for store-specific product pricing and inventory
CREATE TABLE IF NOT EXISTS store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2) DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, product_id)
);

-- Create user_addresses table for customer address management
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'United States',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_methods table for customer payment information
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'paypal', 'bank_account')),
    last_four TEXT NOT NULL,
    brand TEXT, -- Visa, Mastercard, etc.
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    stripe_payment_method_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update product_categories table to include is_primary field (already exists based on types.ts)
-- This table already exists, just ensuring it has the right structure

-- Create commission_tracking table for store commission management
CREATE TABLE IF NOT EXISTS commission_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    commission_rate NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC(10,2) NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_analytics table for store performance tracking
CREATE TABLE IF NOT EXISTS store_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    total_commission NUMERIC(10,2) DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    average_order_value NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- Create user_activity_log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create approval_survey_templates table for approval system
CREATE TABLE IF NOT EXISTS approval_survey_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type TEXT NOT NULL,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_audit_log table for admin actions tracking
CREATE TABLE IF NOT EXISTS system_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action_type TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance

-- Indexes for store_products
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_product_id ON store_products(product_id);
CREATE INDEX IF NOT EXISTS idx_store_products_available ON store_products(is_available) WHERE is_available = true;

-- Indexes for store_hours
CREATE INDEX IF NOT EXISTS idx_store_hours_store_id ON store_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_store_hours_day ON store_hours(day_of_week);

-- Indexes for message_replies
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sender ON message_replies(sender_type, sender_id);

-- Indexes for user_addresses
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(is_default) WHERE is_default = true;

-- Indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = true;

-- Indexes for commission_tracking
CREATE INDEX IF NOT EXISTS idx_commission_tracking_store_id ON commission_tracking(store_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_order_id ON commission_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_payment_status ON commission_tracking(payment_status);

-- Indexes for store_analytics
CREATE INDEX IF NOT EXISTS idx_store_analytics_store_date ON store_analytics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_store_analytics_date ON store_analytics(date);

-- Indexes for enhanced message system
CREATE INDEX IF NOT EXISTS idx_customer_messages_customer_id ON customer_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_messages_status ON customer_messages(status);
CREATE INDEX IF NOT EXISTS idx_customer_messages_archived ON customer_messages(is_archived);

-- Indexes for enhanced order system
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_fraud_risk ON orders(fraud_risk_level);

-- Indexes for enhanced user system
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need them
DROP TRIGGER IF EXISTS update_store_hours_updated_at ON store_hours;
CREATE TRIGGER update_store_hours_updated_at
    BEFORE UPDATE ON store_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_managers_updated_at ON store_managers;
CREATE TRIGGER update_store_managers_updated_at
    BEFORE UPDATE ON store_managers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_products_updated_at ON store_products;
CREATE TRIGGER update_store_products_updated_at
    BEFORE UPDATE ON store_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_messages_updated_at ON customer_messages;
CREATE TRIGGER update_customer_messages_updated_at
    BEFORE UPDATE ON customer_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_replies_updated_at ON message_replies;
CREATE TRIGGER update_message_replies_updated_at
    BEFORE UPDATE ON message_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default store hours for existing stores (Monday-Friday 9-5, Saturday 10-4, Sunday closed)
INSERT INTO store_hours (store_id, day_of_week, open_time, close_time, is_closed)
SELECT 
    id as store_id,
    generate_series(0, 6) as day_of_week,
    CASE 
        WHEN generate_series(0, 6) = 0 THEN NULL -- Sunday
        WHEN generate_series(0, 6) = 6 THEN '10:00:00'::TIME -- Saturday
        ELSE '09:00:00'::TIME -- Monday-Friday
    END as open_time,
    CASE 
        WHEN generate_series(0, 6) = 0 THEN NULL -- Sunday
        WHEN generate_series(0, 6) = 6 THEN '16:00:00'::TIME -- Saturday
        ELSE '17:00:00'::TIME -- Monday-Friday
    END as close_time,
    CASE 
        WHEN generate_series(0, 6) = 0 THEN TRUE -- Sunday closed
        ELSE FALSE
    END as is_closed
FROM stores
WHERE NOT EXISTS (
    SELECT 1 FROM store_hours WHERE store_hours.store_id = stores.id
);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description, category, is_public) VALUES
('platform_commission_rate', '3.0', 'Default platform commission rate percentage', 'financial', false),
('default_delivery_fee', '5.99', 'Default delivery fee amount', 'financial', true),
('fraud_detection_enabled', 'true', 'Enable automatic fraud detection', 'security', false),
('auto_approve_low_risk', 'false', 'Automatically approve low-risk orders', 'orders', false),
('message_retention_days', '365', 'Number of days to retain messages', 'system', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create Row Level Security (RLS) policies

-- Enable RLS on new tables
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_messages
CREATE POLICY "Users can view own messages" ON customer_messages
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own messages" ON customer_messages
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all customer messages" ON customer_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create policies for message_replies
CREATE POLICY "Users can view replies to their messages" ON message_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_messages cm 
            WHERE cm.id = message_replies.message_id 
            AND cm.customer_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM merchant_messages mm 
            WHERE mm.id = message_replies.message_id 
            AND (mm.sender_id = auth.uid() OR mm.recipient_id = auth.uid())
        )
    );

-- Create policies for store_hours (public read access)
CREATE POLICY "Store hours are publicly viewable" ON store_hours
    FOR SELECT USING (true);

CREATE POLICY "Store owners can manage their store hours" ON store_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE id = store_hours.store_id 
            AND owner_id = auth.uid()
        )
    );

-- Create policies for store_products
CREATE POLICY "Store products are publicly viewable" ON store_products
    FOR SELECT USING (true);

CREATE POLICY "Store owners can manage their store products" ON store_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE id = store_products.store_id 
            AND owner_id = auth.uid()
        )
    );

-- Create policies for user_addresses
CREATE POLICY "Users can manage their own addresses" ON user_addresses
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for payment_methods
CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for store_analytics (store owners and admins only)
CREATE POLICY "Store owners can view their analytics" ON store_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE id = store_analytics.store_id 
            AND owner_id = auth.uid()
        )
    );

-- Admin policies for system tables
CREATE POLICY "Admins can manage admin settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Public settings are viewable" ON admin_settings
    FOR SELECT USING (is_public = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update existing table schemas to match the new enhanced features
COMMENT ON TABLE customer_messages IS 'Customer support messages and inquiries';
COMMENT ON TABLE message_replies IS 'Replies to customer and merchant messages';
COMMENT ON TABLE store_hours IS 'Operating hours for each store by day of week';
COMMENT ON TABLE store_managers IS 'Store management team assignments';
COMMENT ON TABLE store_products IS 'Store-specific product pricing and inventory';
COMMENT ON TABLE user_addresses IS 'Customer shipping and billing addresses';
COMMENT ON TABLE payment_methods IS 'Customer payment method information';
COMMENT ON TABLE commission_tracking IS 'Commission calculations and payments for stores';
COMMENT ON TABLE admin_settings IS 'System configuration settings';
COMMENT ON TABLE store_analytics IS 'Daily analytics data for stores';
COMMENT ON TABLE user_activity_log IS 'User action tracking for security and analytics';
COMMENT ON TABLE approval_survey_templates IS 'Survey templates for different approval types';
COMMENT ON TABLE system_audit_log IS 'Admin action audit trail';

-- Create views for common queries

-- Store analytics summary view
CREATE OR REPLACE VIEW store_analytics_summary AS
SELECT 
    s.id,
    s.name,
    s.commission_rate,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(ct.commission_amount), 0) as total_commission,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    COALESCE(AVG(o.total_amount), 0) as average_order_value,
    COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as monthly_orders,
    COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.total_amount ELSE 0 END), 0) as monthly_revenue
FROM stores s
LEFT JOIN order_items oi ON s.id = oi.store_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
LEFT JOIN commission_tracking ct ON s.id = ct.store_id
GROUP BY s.id, s.name, s.commission_rate;

-- User order summary view
CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.is_blocked,
    p.status,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    COALESCE(AVG(o.total_amount), 0) as average_order_value,
    MAX(o.created_at) as last_order_date,
    COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as monthly_orders
FROM profiles p
LEFT JOIN orders o ON p.id = o.customer_id AND o.status != 'cancelled'
WHERE p.role = 'customer'
GROUP BY p.id, p.first_name, p.last_name, p.email, p.is_blocked, p.status;

-- Product availability view across stores
CREATE OR REPLACE VIEW product_store_availability AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.slug,
    p.price as base_price,
    COUNT(sp.store_id) as available_stores,
    MIN(sp.price) as min_price,
    MAX(sp.price) as max_price,
    AVG(sp.price) as avg_price,
    SUM(sp.inventory_quantity) as total_inventory
FROM products p
LEFT JOIN store_products sp ON p.id = sp.product_id AND sp.is_available = true
GROUP BY p.id, p.name, p.slug, p.price;

-- Grant permissions on views
GRANT SELECT ON store_analytics_summary TO authenticated;
GRANT SELECT ON user_order_summary TO authenticated;
GRANT SELECT ON product_store_availability TO authenticated;

-- Final comment
COMMENT ON SCHEMA public IS 'Enhanced BeautyFetch database schema with comprehensive admin features, multi-store support, enhanced user management, and advanced analytics'; 