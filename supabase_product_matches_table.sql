-- Create product_matches table for storing pre-scraped product matches
-- This mimics BuyHatke's approach of storing matches in database instead of live scraping

CREATE TABLE IF NOT EXISTS product_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  matched_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  similarity DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  match_reason TEXT NOT NULL DEFAULT 'Product similarity match',
  price_difference DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_difference_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  savings TEXT NOT NULL DEFAULT 'No savings',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_matches_source_product_id ON product_matches(source_product_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_matched_product_id ON product_matches(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_confidence ON product_matches(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_product_matches_created_at ON product_matches(created_at DESC);

-- Create unique constraint to prevent duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_matches_unique 
ON product_matches(source_product_id, matched_product_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see matches for their own products
CREATE POLICY "Users can view matches for their own products" ON product_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_matches.source_product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Policy: Service role can insert/update/delete matches
CREATE POLICY "Service role can manage all matches" ON product_matches
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_matches_updated_at 
  BEFORE UPDATE ON product_matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE product_matches IS 'Stores pre-scraped product matches to avoid live scraping and rate limiting';
COMMENT ON COLUMN product_matches.source_product_id IS 'ID of the product being matched against';
COMMENT ON COLUMN product_matches.matched_product_id IS 'ID of the product that matches the source';
COMMENT ON COLUMN product_matches.confidence IS 'Confidence score of the match (0.00 to 1.00)';
COMMENT ON COLUMN product_matches.similarity IS 'Similarity score of the match (0.00 to 1.00)';
COMMENT ON COLUMN product_matches.match_reason IS 'Human-readable reason for the match';
COMMENT ON COLUMN product_matches.price_difference IS 'Absolute price difference between products';
COMMENT ON COLUMN product_matches.price_difference_percent IS 'Percentage price difference';
COMMENT ON COLUMN product_matches.savings IS 'Savings text (e.g., "Save 15%")';
