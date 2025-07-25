import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ysmzgrtfxbtqkaeltoug.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testDatabase() {
  console.log('🧪 Testing database tables...');
  
  try {
    // Test stores table
    console.log('\n📦 Testing stores table...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.error('❌ Stores table error:', storesError);
    } else {
      console.log('✅ Stores table exists:', stores?.length || 0, 'stores found');
      if (stores && stores.length > 0) {
        console.log('   Sample store:', stores[0]);
      }
    }
    
    // Test categories table
    console.log('\n📂 Testing categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError);
    } else {
      console.log('✅ Categories table exists:', categories?.length || 0, 'categories found');
      if (categories && categories.length > 0) {
        console.log('   Sample category:', categories[0]);
      }
    }
    
    // Test products table
    console.log('\n🛍️ Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Products table error:', productsError);
    } else {
      console.log('✅ Products table exists:', products?.length || 0, 'products found');
      if (products && products.length > 0) {
        console.log('   Sample product:', products[0]);
      }
    }
    
    // Test inserting a simple store
    console.log('\n📝 Testing store insertion...');
    const { data: newStore, error: storeInsertError } = await supabase
      .from('stores')
      .insert({
        name: 'Test Store',
        slug: 'test-store-' + Date.now(),
        description: 'Test store for import functionality',
        status: 'active'
      })
      .select()
      .single();
    
    if (storeInsertError) {
      console.error('❌ Store insertion failed:', storeInsertError);
    } else {
      console.log('✅ Store insertion successful:', newStore);
      
      // Clean up - delete the test store
      const { error: deleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', newStore.id);
      
      if (deleteError) {
        console.error('❌ Store deletion failed:', deleteError);
      } else {
        console.log('✅ Test store cleaned up');
      }
    }
    
    // Test inserting a simple category
    console.log('\n📝 Testing category insertion...');
    const { data: newCategory, error: categoryInsertError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
        description: 'Test category for import functionality',
        is_active: true
      })
      .select()
      .single();
    
    if (categoryInsertError) {
      console.error('❌ Category insertion failed:', categoryInsertError);
    } else {
      console.log('✅ Category insertion successful:', newCategory);
      
      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', newCategory.id);
      
      if (deleteError) {
        console.error('❌ Category deletion failed:', deleteError);
      } else {
        console.log('✅ Test category cleaned up');
      }
    }
    
    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 