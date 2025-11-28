-- Create table for AI recommendations caching
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommendation_text JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(product_id)
);

-- Create index for fast lookups by product_id
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_product_id ON ai_recommendations(product_id);

-- Create index for expiry checks
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_expires_at ON ai_recommendations(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (public)
CREATE POLICY "Allow public read access" ON ai_recommendations
  FOR SELECT USING (true);

-- Policy: Allow service role (backend) to insert/update
CREATE POLICY "Allow service role full access" ON ai_recommendations
  FOR ALL USING (true) WITH CHECK (true);
