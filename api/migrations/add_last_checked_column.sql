-- Migration: Add last_checked column to products table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add the column
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_last_checked ON products(last_checked);

-- Verify migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'last_checked';

-- Update existing products with current timestamp (optional)
-- This prevents all products from updating at once
UPDATE products 
SET last_checked = NOW() - INTERVAL '5 hours' 
WHERE last_checked IS NULL;
