-- Add subscription fields to users table for LemonSqueezy integration
-- Run this migration on your Supabase database

-- Add subscription columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMP;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_customer_id ON users(lemon_squeezy_customer_id);

-- Add comment to document the schema
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free or pro';
COMMENT ON COLUMN users.subscription_status IS 'LemonSqueezy subscription status: active, cancelled, expired, on_trial, etc.';
COMMENT ON COLUMN users.subscription_id IS 'LemonSqueezy subscription ID';
COMMENT ON COLUMN users.lemon_squeezy_customer_id IS 'LemonSqueezy customer ID';
COMMENT ON COLUMN users.subscription_ends_at IS 'When the subscription ends (for cancelled subscriptions)';
COMMENT ON COLUMN users.subscription_renews_at IS 'When the subscription renews next';

-- Update existing users to have free tier by default
UPDATE users 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;

-- Create a function to check subscription limits
CREATE OR REPLACE FUNCTION check_user_subscription_limit(
  user_id_param UUID,
  limit_type TEXT
) RETURNS JSON AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  result JSON;
BEGIN
  -- Get user's subscription info
  SELECT subscription_tier, subscription_status
  INTO user_tier, user_status
  FROM users
  WHERE id = user_id_param;

  -- If subscription is not active, treat as free
  IF user_status NOT IN ('active', 'on_trial') THEN
    user_tier := 'free';
  END IF;

  -- Return limits based on tier
  IF user_tier = 'pro' THEN
    result := json_build_object(
      'tier', 'pro',
      'product_limit', 10,
      'ai_recommendation', true,
      'export_data', true,
      'notifications_per_day', 10
    );
  ELSE
    result := json_build_object(
      'tier', 'free',
      'product_limit', 5,
      'ai_recommendation', false,
      'export_data', false,
      'notifications_per_day', 1
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_subscription_limit(UUID, TEXT) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Subscription fields added to users table.';
END $$;
