-- Add new pricing fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_per_item DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2);

-- Add images array to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update store_products table to include cost_price
ALTER TABLE store_products
ALTER COLUMN cost_price SET DEFAULT 0; 