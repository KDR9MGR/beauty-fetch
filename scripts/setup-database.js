import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://ysmzgrtfxbtqkaeltoug.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function setupDatabase() {
  console.log('🚀 Setting up database tables...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        console.log(statement.substring(0, 100) + '...');
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    
    // Test the tables
    console.log('\n🧪 Testing database tables...');
    
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.error('❌ Stores table test failed:', storesError);
    } else {
      console.log('✅ Stores table working:', stores?.length || 0, 'stores found');
    }
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Categories table test failed:', categoriesError);
    } else {
      console.log('✅ Categories table working:', categories?.length || 0, 'categories found');
    }
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table test failed:', productsError);
    } else {
      console.log('✅ Products table working:', products?.length || 0, 'products found');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function setupDatabaseAlternative() {
  console.log('🚀 Setting up database tables (alternative method)...');
  
  try {
    // Create stores table
    console.log('📦 Creating stores table...');
    const { error: storesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (storesError) {
      console.error('❌ Stores table creation failed:', storesError);
    } else {
      console.log('✅ Stores table created');
    }
    
    // Create categories table
    console.log('📂 Creating categories table...');
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (categoriesError) {
      console.error('❌ Categories table creation failed:', categoriesError);
    } else {
      console.log('✅ Categories table created');
    }
    
    // Create products table
    console.log('🛍️ Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          short_description TEXT,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          compare_price DECIMAL(10,2),
          sku VARCHAR(100),
          status VARCHAR(50) DEFAULT 'active',
          featured BOOLEAN DEFAULT false,
          category_id UUID REFERENCES categories(id),
          store_id UUID REFERENCES stores(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (productsError) {
      console.error('❌ Products table creation failed:', productsError);
    } else {
      console.log('✅ Products table created');
    }
    
    // Insert default data
    console.log('📝 Inserting default data...');
    
    // Insert default store
    const { error: storeInsertError } = await supabase
      .from('stores')
      .upsert({
        name: 'Beauty Fetch Store',
        slug: 'beauty-fetch-store',
        description: 'Default store for imported products',
        status: 'active'
      }, { onConflict: 'slug' });
    
    if (storeInsertError) {
      console.error('❌ Default store insertion failed:', storeInsertError);
    } else {
      console.log('✅ Default store inserted');
    }
    
    // Insert default categories
    const defaultCategories = [
      { name: 'Hair Care', slug: 'hair-care', description: 'Hair care products' },
      { name: 'Skin Care', slug: 'skin-care', description: 'Skin care products' },
      { name: 'Makeup', slug: 'makeup', description: 'Cosmetics and makeup' },
      { name: 'Hair Extensions', slug: 'hair-extensions', description: 'Hair extensions and wigs' },
      { name: 'Tools & Accessories', slug: 'tools-accessories', description: 'Beauty tools and accessories' }
    ];
    
    for (const category of defaultCategories) {
      const { error: categoryError } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' });
      
      if (categoryError) {
        console.error(`❌ Category "${category.name}" insertion failed:`, categoryError);
      } else {
        console.log(`✅ Category "${category.name}" inserted`);
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabaseAlternative(); 