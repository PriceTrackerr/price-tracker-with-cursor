-- Supabase Schema for Real Price Tracker
-- Project: xhnadizmoqljlddayaoi
-- URL: https://xhnadizmoqljlddayaoi.supabase.co
-- Run this in your Supabase SQL editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'banned')),
    notification_settings JSONB DEFAULT '{"priceDrops": true, "newProducts": true, "weeklySummary": true}',
    privacy_settings JSONB DEFAULT '{"shareData": false, "analytics": true}',
    preferences JSONB DEFAULT '{"currency": "USD", "language": "en"}',
    seen_price_drop_ids TEXT[] DEFAULT '{}',
    subscription JSONB,
    affiliate JSONB
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_status VARCHAR(20) DEFAULT 'unknown' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'unknown')),
    discount_info TEXT,
    matched_products UUID[] DEFAULT '{}',
    previous_stock_status VARCHAR(20),
    condition VARCHAR(20) CHECK (condition IN ('new', 'used', 'refurbished', 'open_box', 'damaged')),
    condition_score INTEGER CHECK (condition_score >= 0 AND condition_score <= 100),
    condition_details TEXT,
    seller_rating DECIMAL(3,2),
    seller_review_count INTEGER,
    warranty_coverage TEXT,
    return_policy TEXT,
    global_prices JSONB,
    available_coupons JSONB,
    best_stack JSONB,
    final_price DECIMAL(10,2),
    credibility_score INTEGER CHECK (credibility_score >= 0 AND credibility_score <= 100),
    community_rating DECIMAL(3,2),
    community_votes INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    price_guarantees JSONB,
    auto_buy_enabled BOOLEAN DEFAULT FALSE,
    auto_buy_trigger_price DECIMAL(10,2),
    stock_velocity INTEGER,
    price_volatility DECIMAL(5,2),
    predicted_next_price DECIMAL(10,2),
    predicted_price_date TIMESTAMP WITH TIME ZONE
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_title TEXT NOT NULL,
    target_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    restock_alert BOOLEAN DEFAULT FALSE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_title TEXT NOT NULL,
    previous_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    price_drop DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    product_url TEXT
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50),
    stock_status VARCHAR(20),
    discount_percentage DECIMAL(5,2),
    notes TEXT
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    min_purchase DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    category VARCHAR(50),
    terms_conditions TEXT
);

-- Expert curators table
CREATE TABLE IF NOT EXISTS expert_curators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    specialties TEXT[],
    follower_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    success_rate DECIMAL(5,2),
    total_deals_found INTEGER DEFAULT 0,
    average_savings DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared watchlists table
CREATE TABLE IF NOT EXISTS shared_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    product_ids UUID[] DEFAULT '{}',
    follower_count INTEGER DEFAULT 0,
    tags TEXT[],
    average_savings DECIMAL(10,2),
    total_products INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community votes table
CREATE TABLE IF NOT EXISTS community_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global market data table
CREATE TABLE IF NOT EXISTS global_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    country VARCHAR(3) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    shipping_cost DECIMAL(10,2),
    estimated_delivery_days INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_url TEXT
);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('subscription', 'one_time', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    subscription_plan VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    transaction_id VARCHAR(255),
    metadata JSONB
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    features JSONB NOT NULL,
    max_products INTEGER,
    max_alerts INTEGER,
    advanced_analytics BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate tracking table
CREATE TABLE IF NOT EXISTS affiliate_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    affiliate_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,2),
    last_clicked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_coupons_platform ON coupons(platform);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_shared_watchlists_creator_id ON shared_watchlists(creator_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlists_is_public ON shared_watchlists(is_public);
CREATE INDEX IF NOT EXISTS idx_community_votes_product_id ON community_votes(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_global_market_data_product_id ON global_market_data(product_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_user_id ON affiliate_tracking(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_curators ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Products policies
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid()::text = user_id::text);

-- Alerts policies
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE USING (auth.uid()::text = user_id::text);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Price history policies
CREATE POLICY "Users can view price history for their products" ON price_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = price_history.product_id AND products.user_id::text = auth.uid()::text)
);

-- Coupons policies (public read, admin write)
CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
);

-- Expert curators policies
CREATE POLICY "Anyone can view expert curators" ON expert_curators FOR SELECT USING (true);
CREATE POLICY "Users can update own curator profile" ON expert_curators FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Shared watchlists policies
CREATE POLICY "Anyone can view public watchlists" ON shared_watchlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own watchlists" ON shared_watchlists FOR SELECT USING (auth.uid()::text = creator_id::text);
CREATE POLICY "Users can manage own watchlists" ON shared_watchlists FOR ALL USING (auth.uid()::text = creator_id::text);

-- Community votes policies
CREATE POLICY "Users can view all votes" ON community_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON community_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own votes" ON community_votes FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Comments policies
CREATE POLICY "Anyone can view approved comments" ON comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Global market data policies
CREATE POLICY "Anyone can view global market data" ON global_market_data FOR SELECT USING (true);

-- Automation rules policies
CREATE POLICY "Users can manage own automation rules" ON automation_rules FOR ALL USING (auth.uid()::text = user_id::text);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
);

-- Affiliate tracking policies
CREATE POLICY "Users can view own affiliate data" ON affiliate_tracking FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own affiliate data" ON affiliate_tracking FOR ALL USING (auth.uid()::text = user_id::text);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features, max_products, max_alerts, advanced_analytics, priority_support) VALUES
('Free Plan', 'Basic price tracking for personal use', 0.00, 'USD', 'monthly', '{"basic_tracking": true, "email_alerts": true, "price_history": true}', 10, 5, false, false),
('Premium Plan', 'Advanced features for serious shoppers', 9.99, 'USD', 'monthly', '{"unlimited_tracking": true, "advanced_alerts": true, "price_predictions": true, "coupon_finder": true}', 100, 50, true, false),
('Pro Plan', 'Professional features for power users', 19.99, 'USD', 'monthly', '{"unlimited_tracking": true, "advanced_alerts": true, "price_predictions": true, "coupon_finder": true, "global_comparison": true, "api_access": true}', 500, 200, true, true),
('Lifetime Plan', 'One-time payment for lifetime access', 199.99, 'USD', 'lifetime', '{"unlimited_tracking": true, "advanced_alerts": true, "price_predictions": true, "coupon_finder": true, "global_comparison": true, "api_access": true, "priority_support": true}', 1000, 500, true, true);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expert_curators_updated_at BEFORE UPDATE ON expert_curators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_watchlists_updated_at BEFORE UPDATE ON shared_watchlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_tracking_updated_at BEFORE UPDATE ON affiliate_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;