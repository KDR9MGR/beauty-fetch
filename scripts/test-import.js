import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://ysmzgrtfxbtqkaeltoug.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testImport() {
  console.log('🧪 Testing import functionality...');
  
  try {
    // Get existing stores and categories
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1);
    
    if (storesError || !stores || stores.length === 0) {
      throw new Error('No stores available');
    }
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
    
    if (categoriesError || !categories || categories.length === 0) {
      throw new Error('No categories available');
    }
    
    console.log('✅ Found store:', stores[0].name);
    console.log('✅ Found category:', categories[0].name);
    
    // Test product insertion
    const testProduct = {
      name: 'Test Import Product',
      slug: 'test-import-product-' + Date.now(),
      description: 'This is a test product for import functionality',
      short_description: 'Test product',
      price: 29.99,
      compare_price: 39.99,
      sku: 'TEST-001',
      status: 'active',
      featured: false,
      category_id: categories[0].id,
      store_id: stores[0].id
    };
    
    console.log('\n📝 Testing product insertion...');
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();
    
    if (productError) {
      console.error('❌ Product insertion failed:', productError);
      throw new Error(`Product insertion failed: ${productError.message}`);
    } else {
      console.log('✅ Product insertion successful:', newProduct.name);
      
      // Clean up - delete the test product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', newProduct.id);
      
      if (deleteError) {
        console.error('❌ Product deletion failed:', deleteError);
      } else {
        console.log('✅ Test product cleaned up');
      }
    }
    
    // Test CSV processing
    console.log('\n📄 Testing CSV processing...');
    const csvContent = `Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Compare At Price,Image Src,Image Position,Status
test-product-1,Test Product 1,Description for test product 1,Test Vendor,Hair Care,Shampoo,test,TRUE,Title,Default Title,TEST-SKU-001,19.99,24.99,https://example.com/image1.jpg,1,active
test-product-2,Test Product 2,Description for test product 2,Test Vendor,Skin Care,Cream,test,TRUE,Title,Default Title,TEST-SKU-002,29.99,34.99,https://example.com/image2.jpg,1,active`;
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const isShopifyFormat = headers.includes('Handle') && headers.includes('Title') && headers.includes('Vendor');
    
    console.log('CSV Format detected:', isShopifyFormat ? 'Shopify' : 'Simple');
    console.log('Headers:', headers);
    
    // Process the CSV
    const processedProducts = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const rowData = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });
      
      if (rowData.Handle && rowData.Title) {
        processedProducts.push({
          name: rowData.Title,
          slug: rowData.Handle,
          description: rowData['Body (HTML)'] || '',
          short_description: '',
          price: parseFloat(rowData['Variant Price']) || 0,
          compare_price: parseFloat(rowData['Variant Compare At Price']) || null,
          sku: rowData['Variant SKU'] || '',
          status: rowData.Status === 'active' ? 'active' : 'inactive',
          featured: false,
          vendor: rowData.Vendor || '',
          product_category: rowData['Product Category'] || '',
          type: rowData.Type || '',
          category_id: categories[0].id,
          store_id: stores[0].id
        });
      }
    }
    
    console.log('Processed products:', processedProducts.length);
    console.log('Sample product:', processedProducts[0]);
    
    // Test importing the processed products
    console.log('\n📦 Testing import of processed products...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of processedProducts) {
      try {
        const { data: importedProduct, error: importError } = await supabase
          .from('products')
          .insert(product)
          .select()
          .single();
        
        if (importError) {
          console.error(`❌ Failed to import ${product.name}:`, importError.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully imported: ${importedProduct.name}`);
          successCount++;
          
          // Clean up
          await supabase
            .from('products')
            .delete()
            .eq('id', importedProduct.id);
        }
      } catch (error) {
        console.error(`❌ Error importing ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Import test completed!`);
    console.log(`✅ Successfully imported: ${successCount} products`);
    console.log(`❌ Failed imports: ${errorCount} products`);
    
    if (successCount > 0) {
      console.log('\n🎯 Import functionality is working!');
      console.log('The issue is likely with RLS policies or authentication.');
      console.log('To fix this, you need to:');
      console.log('1. Ensure you are authenticated as an admin user');
      console.log('2. Check RLS policies for the products table');
      console.log('3. Make sure the user has INSERT permissions');
    } else {
      console.log('\n❌ Import functionality is not working.');
      console.log('Check the error messages above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImport(); 