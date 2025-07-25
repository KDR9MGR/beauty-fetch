-- Add image_url field to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add description field for better category management
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Create index for category name searches
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name); 