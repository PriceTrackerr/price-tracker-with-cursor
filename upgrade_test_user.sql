-- SQL to run in Supabase SQL Editor to upgrade test user to Pro

UPDATE users 
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  subscription_renews_at = NOW() + INTERVAL '1 year'
WHERE email = 'michaelabrham9@gmail.com';

-- Verify the update
SELECT 
  email, 
  subscription_tier, 
  subscription_status, 
  subscription_renews_at 
FROM users 
WHERE email = 'michaelabrham9@gmail.com';
