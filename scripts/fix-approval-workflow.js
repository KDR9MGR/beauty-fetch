import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysmzgrtfxbtqkaeltoug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixApprovalWorkflow() {
  try {
    console.log('🔧 Fixing Approval Workflow...\n');
    
    // 1. Create admin profile first (if it doesn't exist)
    console.log('1. Creating admin profile...');
    const adminUserId = '13e0af72-2442-49f8-b8ad-c38aa02106ef';
    
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', adminUserId)
      .single();
    
    if (!existingAdmin) {
      console.log('  - Admin profile does not exist, creating...');
      // We'll need to create this manually in Supabase dashboard
      console.log('  ❌ Cannot create admin profile due to RLS. Please create manually:');
      console.log(`     id: ${adminUserId}`);
      console.log('     email: admin@beautyfetch.com');
      console.log('     first_name: Admin');
      console.log('     last_name: User');
      console.log('     role: admin');
      console.log('     status: active');
    } else {
      console.log('  ✅ Admin profile exists');
    }
    
    // 2. Create profiles for approved applications
    console.log('\n2. Creating profiles for approved applications...');
    
    // Get approved merchant applications
    const { data: approvedMerchants } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('status', 'approved');
    
    if (approvedMerchants) {
      console.log(`Found ${approvedMerchants.length} approved merchant applications`);
      
      for (const app of approvedMerchants) {
        console.log(`\nProcessing: ${app.business_name} (${app.email})`);
        
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', app.email)
          .single();
        
        if (existingProfile) {
          console.log(`  ✅ Profile already exists for ${app.email}`);
          continue;
        }
        
        // Check if auth user exists
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: app.email,
            password: 'temppass123456',
            options: {
              data: {
                role: 'store_owner'
              }
            }
          });
          
          if (authError && authError.message !== 'User already registered') {
            console.log(`  ❌ Auth error: ${authError.message}`);
            continue;
          }
          
          const userId = authData.user?.id;
          console.log(`  ✅ Auth user created/verified: ${userId}`);
          
          // Try to create profile
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: app.email,
                first_name: app.contact_person_first_name,
                last_name: app.contact_person_last_name,
                phone: app.phone,
                role: 'store_owner',
                status: 'active',
                email_verified: false
              })
              .select()
              .single();
            
            if (profileError) {
              console.log(`  ❌ Profile creation failed: ${profileError.message}`);
              console.log(`  ❌ Error code: ${profileError.code}`);
              console.log(`  ❌ This is due to RLS policies. Manual fix required.`);
            } else {
              console.log(`  ✅ Profile created: ${profile.id}`);
              
              // Create store
              try {
                const { error: storeError } = await supabase
                  .from('stores')
                  .insert({
                    name: app.business_name,
                    slug: app.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    description: app.business_description,
                    owner_id: profile.id,
                    address: app.business_address,
                    phone: app.phone,
                    email: app.email,
                    status: 'active'
                  });
                
                if (storeError) {
                  console.log(`  ❌ Store creation failed: ${storeError.message}`);
                } else {
                  console.log(`  ✅ Store created for ${app.business_name}`);
                }
              } catch (storeError) {
                console.log(`  ❌ Store creation error: ${storeError.message}`);
              }
            }
          } catch (profileError) {
            console.log(`  ❌ Profile creation error: ${profileError.message}`);
          }
        } catch (error) {
          console.log(`  ❌ Auth creation error: ${error.message}`);
        }
      }
    }
    
    // 3. Create profiles for approved driver applications
    console.log('\n3. Creating profiles for approved driver applications...');
    
    const { data: approvedDrivers } = await supabase
      .from('driver_applications')
      .select('*')
      .eq('status', 'approved');
    
    if (approvedDrivers) {
      console.log(`Found ${approvedDrivers.length} approved driver applications`);
      
      for (const app of approvedDrivers) {
        console.log(`\nProcessing: ${app.first_name} ${app.last_name} (${app.email})`);
        
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', app.email)
          .single();
        
        if (existingProfile) {
          console.log(`  ✅ Profile already exists for ${app.email}`);
          continue;
        }
        
        // Check if auth user exists
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: app.email,
            password: 'temppass123456',
            options: {
              data: {
                role: 'driver'
              }
            }
          });
          
          if (authError && authError.message !== 'User already registered') {
            console.log(`  ❌ Auth error: ${authError.message}`);
            continue;
          }
          
          const userId = authData.user?.id;
          console.log(`  ✅ Auth user created/verified: ${userId}`);
          
          // Try to create profile
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: app.email,
                first_name: app.first_name,
                last_name: app.last_name,
                phone: app.phone,
                role: 'driver',
                status: 'active',
                email_verified: false
              })
              .select()
              .single();
            
            if (profileError) {
              console.log(`  ❌ Profile creation failed: ${profileError.message}`);
              console.log(`  ❌ Error code: ${profileError.code}`);
              console.log(`  ❌ This is due to RLS policies. Manual fix required.`);
            } else {
              console.log(`  ✅ Profile created: ${profile.id}`);
            }
          } catch (profileError) {
            console.log(`  ❌ Profile creation error: ${profileError.message}`);
          }
        } catch (error) {
          console.log(`  ❌ Auth creation error: ${error.message}`);
        }
      }
    }
    
    // 4. Summary and manual fixes needed
    console.log('\n📋 SUMMARY & MANUAL FIXES REQUIRED:');
    console.log('The approval workflow is blocked by RLS (Row Level Security) policies.');
    console.log('\n🔧 MANUAL FIXES NEEDED IN SUPABASE DASHBOARD:');
    console.log('\n1. Fix RLS Policies:');
    console.log('   Go to: Supabase Dashboard > Authentication > Policies');
    console.log('   Find the "profiles" table and add this policy:');
    console.log(`
   CREATE POLICY "Enable insert for authenticated users" ON profiles
   FOR INSERT TO authenticated
   WITH CHECK (true);
   `);
    console.log('\n2. Create Admin Profile:');
    console.log('   Go to: Supabase Dashboard > Table Editor > profiles');
    console.log('   Click "Insert" and add:');
    console.log(`   - id: ${adminUserId}`);
    console.log('   - email: admin@beautyfetch.com');
    console.log('   - first_name: Admin');
    console.log('   - last_name: User');
    console.log('   - role: admin');
    console.log('   - status: active');
    console.log('\n3. Create Profiles for Approved Applications:');
    console.log('   For each approved application, create a profile manually:');
    
    if (approvedMerchants) {
      approvedMerchants.forEach(app => {
        console.log(`   - ${app.email} (${app.contact_person_first_name} ${app.contact_person_last_name}) - role: store_owner`);
      });
    }
    
    if (approvedDrivers) {
      approvedDrivers.forEach(app => {
        console.log(`   - ${app.email} (${app.first_name} ${app.last_name}) - role: driver`);
      });
    }
    
    console.log('\n4. Test Login Credentials:');
    console.log('   After creating profiles, users can login with:');
    console.log('   - Email: their application email');
    console.log('   - Password: temppass123456');
    console.log('   - Admin: admin@beautyfetch.com / admin123456');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixApprovalWorkflow(); 