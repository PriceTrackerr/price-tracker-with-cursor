-- Add last_checked column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE;

-- Optional: Create an index for performance since we query by this column
CREATE INDEX IF NOT EXISTS idx_products_last_checked ON products(last_checked);
