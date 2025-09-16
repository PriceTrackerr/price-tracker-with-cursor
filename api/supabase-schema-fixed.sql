-- Supabase Schema for Real Price Tracker (Fixed Version)
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
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'one_time')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'ETB', 'EUR')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('chapa', 'paypal', 'webirr', 'manual')),
    payment_gateway_id VARCHAR(255),
    subscription_plan VARCHAR(20) CHECK (subscription_plan IN ('premium', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Affiliate transactions table
CREATE TABLE IF NOT EXISTS affiliate_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('signup', 'subscription', 'renewal')),
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255)
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'ETB')),
    method VARCHAR(20) NOT NULL CHECK (method IN ('paypal', 'bybit', 'bank', 'wise')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),
    details JSONB
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
    features JSONB NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'bogo', 'shipping')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_stackable BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    platform VARCHAR(50) NOT NULL,
    categories TEXT[],
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon stacks table
CREATE TABLE IF NOT EXISTS coupon_stacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupons JSONB NOT NULL,
    total_discount DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    savings DECIMAL(10,2) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price guarantees table
CREATE TABLE IF NOT EXISTS price_guarantees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer VARCHAR(100) NOT NULL,
    policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN ('price_match', 'price_protection', 'best_price_guarantee')),
    window_days INTEGER NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE,
    eligible_until TIMESTAMP WITH TIME ZONE,
    claimable_amount DECIMAL(10,2),
    is_claimable BOOLEAN DEFAULT FALSE,
    claim_url TEXT,
    requirements TEXT[],
    status VARCHAR(20) DEFAULT 'eligible' CHECK (status IN ('eligible', 'claimed', 'expired', 'ineligible')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expert curators table
CREATE TABLE IF NOT EXISTS expert_curators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    specialties TEXT[] NOT NULL,
    follower_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    credibility_score INTEGER DEFAULT 0 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    total_deals_shared INTEGER DEFAULT 0,
    average_savings DECIMAL(10,2) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared watchlists table
CREATE TABLE IF NOT EXISTS shared_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    product_ids UUID[] DEFAULT '{}',
    follower_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    average_savings DECIMAL(10,2),
    total_products INTEGER DEFAULT 0
);

-- Community votes table
CREATE TABLE IF NOT EXISTS community_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Deal comments table
CREATE TABLE IF NOT EXISTS deal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_id UUID REFERENCES deal_comments(id) ON DELETE CASCADE
);

-- Global market data table
CREATE TABLE IF NOT EXISTS global_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    markets JSONB NOT NULL,
    best_deal JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('auto_buy', 'price_alert', 'stock_alert', 'coupon_alert')),
    is_active BOOLEAN DEFAULT TRUE,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_history JSONB DEFAULT '[]'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_affiliate_user_id ON affiliate_transactions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_affiliate_user_id ON payout_requests(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_product_id ON community_votes(product_id);
CREATE INDEX IF NOT EXISTS idx_deal_comments_product_id ON deal_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_curators ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Products: users can view all, but only modify their own
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid()::text = user_id::text);

-- Alerts: users can only access their own
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE USING (auth.uid()::text = user_id::text);

-- Notifications: users can only access their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Price history: viewable by everyone
CREATE POLICY "Price history is viewable by everyone" ON price_history FOR SELECT USING (true);
CREATE POLICY "Price history can be inserted by authenticated users" ON price_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Payments: users can only access their own
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Public data: viewable by everyone
CREATE POLICY "Coupons are viewable by everyone" ON coupons FOR SELECT USING (true);
CREATE POLICY "Expert curators are viewable by everyone" ON expert_curators FOR SELECT USING (true);
CREATE POLICY "Shared watchlists are viewable by everyone" ON shared_watchlists FOR SELECT USING (true);
CREATE POLICY "Community votes are viewable by everyone" ON community_votes FOR SELECT USING (true);
CREATE POLICY "Deal comments are viewable by everyone" ON deal_comments FOR SELECT USING (true);
CREATE POLICY "Global market data is viewable by everyone" ON global_market_data FOR SELECT USING (true);

-- Insert some default subscription plans with proper UUIDs
INSERT INTO subscription_plans (id, name, price, currency, interval, features) VALUES
(
    uuid_generate_v4(),
    'Free',
    0.00,
    'USD',
    'monthly',
    '{"maxTrackedProducts": 5, "alertFrequency": "daily", "priceHistoryDays": 30, "exportData": false, "prioritySupport": false}'
),
(
    uuid_generate_v4(),
    'Premium',
    9.99,
    'USD',
    'monthly',
    '{"maxTrackedProducts": 50, "alertFrequency": "hourly", "priceHistoryDays": 90, "exportData": true, "prioritySupport": false}'
),
(
    uuid_generate_v4(),
    'Pro',
    19.99,
    'USD',
    'monthly',
    '{"maxTrackedProducts": 200, "alertFrequency": "instant", "priceHistoryDays": 365, "exportData": true, "prioritySupport": true}'
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_watchlists_updated_at BEFORE UPDATE ON shared_watchlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_comments_updated_at BEFORE UPDATE ON deal_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 