-- =====================================================
-- ULTRA-MINIMAL PRODUCT MATCHING SCHEMA
-- =====================================================

-- 1. Create product_matches table
CREATE TABLE IF NOT EXISTS product_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  title TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  url TEXT NOT NULL,
  image_url TEXT,
  platform VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create serper_matches_cache table
CREATE TABLE IF NOT EXISTS serper_matches_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  search_query TEXT NOT NULL,
  serper_results JSONB NOT NULL,
  parsed_matches JSONB,
  match_count INTEGER DEFAULT 0,
  search_type VARCHAR(20) DEFAULT 'initial',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STATUS CHECK
SELECT 
  'product_matches setup complete' as status,
  COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'product_matches';