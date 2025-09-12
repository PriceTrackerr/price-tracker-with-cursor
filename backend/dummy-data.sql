-- Dummy Data for Price Tracker Testing
-- Run this in your Supabase SQL Editor after deploying the schema

-- Insert test users
INSERT INTO users (id, email, password, username, role, preferences, notification_settings) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'admin', '{"currency": "USD", "language": "en"}', '{"priceDrops": true, "newProducts": true, "weeklySummary": true}'),
('550e8400-e29b-41d4-a716-446655440002', 'john@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'john_doe', 'user', '{"currency": "USD", "language": "en"}', '{"priceDrops": true, "newProducts": false, "weeklySummary": true}'),
('550e8400-e29b-41d4-a716-446655440003', 'sarah@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sarah_smith', 'user', '{"currency": "EUR", "language": "en"}', '{"priceDrops": true, "newProducts": true, "weeklySummary": false}'),
('550e8400-e29b-41d4-a716-446655440004', 'mike@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mike_wilson', 'user', '{"currency": "USD", "language": "en"}', '{"priceDrops": false, "newProducts": true, "weeklySummary": true}');

-- Insert test products
INSERT INTO products (id, url, title, price, currency, platform, image_url, user_id, stock_status, condition, condition_score, credibility_score, community_rating, is_verified) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://amazon.com/dp/B08N5WRWNW', 'iPhone 15 Pro 128GB Natural Titanium', 999.00, 'USD', 'amazon', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440002', 'in_stock', 'new', 95, 88, 4.5, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://amazon.com/dp/B0BDJHRZ5L', 'MacBook Pro 14-inch M3 Pro 512GB', 1999.00, 'USD', 'amazon', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440002', 'in_stock', 'new', 98, 92, 4.7, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://aliexpress.com/item/1005001234567890.html', 'Samsung Galaxy S24 Ultra 256GB', 1199.00, 'USD', 'aliexpress', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440003', 'in_stock', 'new', 90, 85, 4.3, false),
('660e8400-e29b-41d4-a716-446655440004', 'https://ebay.com/itm/123456789012', 'AirPods Pro 2nd Generation', 249.00, 'USD', 'ebay', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440003', 'in_stock', 'new', 92, 89, 4.6, true),
('660e8400-e29b-41d4-a716-446655440005', 'https://walmart.com/ip/123456789', 'Sony WH-1000XM5 Headphones', 399.99, 'USD', 'walmart', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440004', 'out_of_stock', 'new', 94, 87, 4.4, true),
('660e8400-e29b-41d4-a716-446655440006', 'https://shein.com/product/123456789', 'Wireless Gaming Mouse RGB', 29.99, 'USD', 'shein', 'https://images.unsplash.com/photo-1527864550417-7fd91c51a50e?w=400&h=300&fit=crop', '550e8400-e29b-41d4-a716-446655440004', 'in_stock', 'new', 78, 72, 3.8, false);

-- Insert price history
INSERT INTO price_history (product_id, price, currency, timestamp) VALUES
('660e8400-e29b-41d4-a716-446655440001', 1099.00, 'USD', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440001', 1049.00, 'USD', NOW() - INTERVAL '5 days'),
('660e8400-e29b-41d4-a716-446655440001', 999.00, 'USD', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440002', 2199.00, 'USD', NOW() - INTERVAL '10 days'),
('660e8400-e29b-41d4-a716-446655440002', 2099.00, 'USD', NOW() - INTERVAL '5 days'),
('660e8400-e29b-41d4-a716-446655440002', 1999.00, 'USD', NOW() - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440003', 1299.00, 'USD', NOW() - INTERVAL '14 days'),
('660e8400-e29b-41d4-a716-446655440003', 1249.00, 'USD', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440003', 1199.00, 'USD', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440004', 279.00, 'USD', NOW() - INTERVAL '21 days'),
('660e8400-e29b-41d4-a716-446655440004', 259.00, 'USD', NOW() - INTERVAL '14 days'),
('660e8400-e29b-41d4-a716-446655440004', 249.00, 'USD', NOW() - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440005', 449.99, 'USD', NOW() - INTERVAL '30 days'),
('660e8400-e29b-41d4-a716-446655440005', 424.99, 'USD', NOW() - INTERVAL '21 days'),
('660e8400-e29b-41d4-a716-446655440005', 399.99, 'USD', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440006', 39.99, 'USD', NOW() - INTERVAL '14 days'),
('660e8400-e29b-41d4-a716-446655440006', 34.99, 'USD', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440006', 29.99, 'USD', NOW() - INTERVAL '2 days');

-- Insert alerts
INSERT INTO alerts (id, product_id, product_title, target_price, current_price, is_active, email, user_id, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro 128GB Natural Titanium', 950.00, 999.00, true, 'john@example.com', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '3 days'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'MacBook Pro 14-inch M3 Pro 512GB', 1800.00, 1999.00, true, 'john@example.com', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Samsung Galaxy S24 Ultra 256GB', 1100.00, 1199.00, true, 'sarah@example.com', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'AirPods Pro 2nd Generation', 200.00, 249.00, true, 'sarah@example.com', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '7 days'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'Sony WH-1000XM5 Headphones', 350.00, 399.99, false, 'mike@example.com', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '10 days');

-- Insert notifications
INSERT INTO notifications (user_id, product_id, product_title, previous_price, current_price, price_drop, type, is_read, product_url) VALUES
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro 128GB Natural Titanium', 1049.00, 999.00, 50.00, 'price_drop', false, 'https://amazon.com/dp/B08N5WRWNW'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'MacBook Pro 14-inch M3 Pro 512GB', 2099.00, 1999.00, 100.00, 'price_drop', false, 'https://amazon.com/dp/B0BDJHRZ5L'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Samsung Galaxy S24 Ultra 256GB', 1249.00, 1199.00, 50.00, 'price_drop', true, 'https://aliexpress.com/item/1005001234567890.html'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'AirPods Pro 2nd Generation', 259.00, 249.00, 10.00, 'price_drop', false, 'https://ebay.com/itm/123456789012'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', 'Sony WH-1000XM5 Headphones', 424.99, 399.99, 25.00, 'price_drop', true, 'https://walmart.com/ip/123456789'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440006', 'Wireless Gaming Mouse RGB', 34.99, 29.99, 5.00, 'price_drop', false, 'https://shein.com/product/123456789');

-- Insert coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, expires_at, is_stackable, is_verified, platform, categories, usage_count, success_rate) VALUES
('SAVE20', '20% off electronics', 'percentage', 20.00, 100.00, NOW() + INTERVAL '30 days', true, true, 'amazon', ARRAY['electronics', 'gadgets'], 45, 85.5),
('FREESHIP', 'Free shipping on orders over $50', 'shipping', 0.00, 50.00, NOW() + INTERVAL '15 days', true, true, 'amazon', ARRAY['shipping'], 120, 92.3),
('WELCOME10', '10% off first order', 'percentage', 10.00, 25.00, NOW() + INTERVAL '60 days', false, true, 'aliexpress', ARRAY['new_user'], 78, 88.7),
('TECH15', '15% off tech products', 'percentage', 15.00, 200.00, NOW() + INTERVAL '45 days', true, true, 'ebay', ARRAY['electronics', 'computers'], 32, 76.9),
('SUMMER25', '25% off summer collection', 'percentage', 25.00, 75.00, NOW() + INTERVAL '20 days', false, true, 'shein', ARRAY['fashion', 'clothing'], 156, 91.2);

-- Insert expert curators
INSERT INTO expert_curators (name, bio, specialties, follower_count, is_verified, credibility_score, total_deals_shared, average_savings) VALUES
('TechDeals Pro', 'Expert in finding the best tech deals and price drops', ARRAY['electronics', 'computers', 'smartphones'], 12500, true, 95, 234, 125.50),
('Fashion Finder', 'Specializes in clothing and fashion deals', ARRAY['fashion', 'clothing', 'accessories'], 8900, true, 88, 189, 45.75),
('Home & Garden Expert', 'Finds amazing deals for your home', ARRAY['home', 'garden', 'furniture'], 6700, false, 82, 145, 78.25),
('Gaming Guru', 'Gaming equipment and console deals specialist', ARRAY['gaming', 'consoles', 'accessories'], 15200, true, 92, 312, 89.90);

-- Insert shared watchlists
INSERT INTO shared_watchlists (name, description, creator_id, creator_name, is_public, category, product_ids, follower_count, tags, average_savings, total_products) VALUES
('Best Tech Deals 2024', 'Curated list of the best technology deals this year', '550e8400-e29b-41d4-a716-446655440001', 'admin', true, 'technology', ARRAY['660e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid], 450, ARRAY['tech', 'deals', '2024'], 150.25, 3),
('Gaming Essentials', 'Must-have gaming equipment at great prices', '550e8400-e29b-41d4-a716-446655440002', 'john_doe', true, 'gaming', ARRAY['660e8400-e29b-41d4-a716-446655440004'::uuid, '660e8400-e29b-41d4-a716-446655440006'::uuid], 230, ARRAY['gaming', 'equipment', 'deals'], 75.50, 2),
('Audio & Music', 'High-quality audio equipment deals', '550e8400-e29b-41d4-a716-446655440003', 'sarah_smith', false, 'audio', ARRAY['660e8400-e29b-41d4-a716-446655440005'::uuid], 89, ARRAY['audio', 'music', 'headphones'], 125.00, 1);

-- Insert community votes
INSERT INTO community_votes (user_id, product_id, vote_type, reason) VALUES
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'upvote', 'Great deal on iPhone!'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'upvote', 'Excellent price drop'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'upvote', 'Worth buying at this price'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'upvote', 'MacBook Pro is a great investment'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'upvote', 'Samsung Galaxy is reliable'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'upvote', 'AirPods Pro sound amazing'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'upvote', 'Sony headphones are top quality'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', 'downvote', 'Quality seems questionable');

-- Insert deal comments
INSERT INTO deal_comments (product_id, user_id, user_name, content, upvotes, downvotes, is_verified) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'john_doe', 'This is an amazing deal! I bought it last week and it works perfectly.', 12, 1, true),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'sarah_smith', 'Great price drop! The camera quality is outstanding.', 8, 0, false),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'john_doe', 'MacBook Pro M3 is incredibly fast. Worth every penny!', 15, 0, true),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'sarah_smith', 'Samsung Galaxy S24 Ultra has excellent battery life.', 6, 1, false),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'mike_wilson', 'AirPods Pro 2nd gen has much better noise cancellation.', 9, 0, true),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'mike_wilson', 'Sony WH-1000XM5 has the best sound quality I have ever heard.', 11, 0, true);

-- Insert global market data
INSERT INTO global_market_data (product_id, markets, best_deal) VALUES
('660e8400-e29b-41d4-a716-446655440001', '{"US": {"price": 999, "currency": "USD", "retailer": "Amazon"}, "UK": {"price": 799, "currency": "GBP", "retailer": "Apple Store"}, "DE": {"price": 1099, "currency": "EUR", "retailer": "MediaMarkt"}}', '{"country": "UK", "price": 799, "currency": "GBP", "savings": 200}'),
('660e8400-e29b-41d4-a716-446655440002', '{"US": {"price": 1999, "currency": "USD", "retailer": "Amazon"}, "UK": {"price": 1899, "currency": "GBP", "retailer": "Apple Store"}, "CA": {"price": 2699, "currency": "CAD", "retailer": "Best Buy"}}', '{"country": "UK", "price": 1899, "currency": "GBP", "savings": 100}'),
('660e8400-e29b-41d4-a716-446655440003', '{"US": {"price": 1199, "currency": "USD", "retailer": "AliExpress"}, "UK": {"price": 999, "currency": "GBP", "retailer": "Samsung Store"}, "DE": {"price": 1099, "currency": "EUR", "retailer": "Saturn"}}', '{"country": "UK", "price": 999, "currency": "GBP", "savings": 200}');

-- Insert automation rules
INSERT INTO automation_rules (user_id, product_id, type, is_active, conditions, actions) VALUES
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'price_alert', true, '{"target_price": 950, "price_drop_percent": 5}', '{"email_notification": true, "push_notification": true}'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'price_alert', true, '{"target_price": 1100, "price_drop_percent": 10}', '{"email_notification": true, "push_notification": false}'),
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', 'stock_alert', true, '{"stock_status": "in_stock"}', '{"email_notification": true, "push_notification": true}');

-- Update product matching data
UPDATE products SET 
    matched_products = ARRAY['660e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440004'::uuid]
WHERE id = '660e8400-e29b-41d4-a716-446655440001';

UPDATE products SET 
    matched_products = ARRAY['660e8400-e29b-41d4-a716-446655440001'::uuid]
WHERE id = '660e8400-e29b-41d4-a716-446655440002';

-- Insert some payments
INSERT INTO payments (user_id, type, amount, currency, status, payment_method, subscription_plan, created_at, completed_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'subscription', 9.99, 'USD', 'completed', 'paypal', 'premium', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440003', 'subscription', 19.99, 'USD', 'completed', 'paypal', 'pro', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440004', 'one_time', 4.99, 'USD', 'completed', 'paypal', null, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');

-- Insert affiliate transactions
INSERT INTO affiliate_transactions (affiliate_user_id, referred_user_id, type, amount, commission, status, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'signup', 0.00, 5.00, 'approved', NOW() - INTERVAL '45 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'subscription', 9.99, 1.99, 'approved', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'subscription', 19.99, 3.99, 'pending', NOW() - INTERVAL '15 days');
