import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysmzgrtfxbtqkaeltoug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugApprovalWorkflow() {
  try {
    console.log('🔍 Debugging Approval Workflow...\n');
    
    // 1. Check approved applications
    console.log('1. Checking approved applications...');
    const { data: approvedMerchants, error: merchantError } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('status', 'approved');
    
    if (merchantError) {
      console.error('Error fetching approved merchants:', merchantError);
    } else {
      console.log(`Found ${approvedMerchants?.length || 0} approved merchant applications`);
      approvedMerchants?.forEach(app => {
        console.log(`  - ${app.business_name} (${app.email}) - Created: ${new Date(app.created_at).toLocaleDateString()}`);
      });
    }
    
    const { data: approvedDrivers, error: driverError } = await supabase
      .from('driver_applications')
      .select('*')
      .eq('status', 'approved');
    
    if (driverError) {
      console.error('Error fetching approved drivers:', driverError);
    } else {
      console.log(`Found ${approvedDrivers?.length || 0} approved driver applications`);
      approvedDrivers?.forEach(app => {
        console.log(`  - ${app.first_name} ${app.last_name} (${app.email}) - Created: ${new Date(app.created_at).toLocaleDateString()}`);
      });
    }
    
    // 2. Check if profiles exist for approved applications
    console.log('\n2. Checking profiles for approved applications...');
    if (approvedMerchants) {
      for (const app of approvedMerchants) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('email', app.email)
          .single();
        
        if (profile) {
          console.log(`  ✅ Profile exists for ${app.email} (${profile.role})`);
        } else {
          console.log(`  ❌ No profile for ${app.email}`);
        }
      }
    }
    
    if (approvedDrivers) {
      for (const app of approvedDrivers) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('email', app.email)
          .single();
        
        if (profile) {
          console.log(`  ✅ Profile exists for ${app.email} (${profile.role})`);
        } else {
          console.log(`  ❌ No profile for ${app.email}`);
        }
      }
    }
    
    // 3. Test profile creation manually
    console.log('\n3. Testing profile creation manually...');
    if (approvedMerchants && approvedMerchants.length > 0) {
      const testApp = approvedMerchants[0];
      console.log(`Testing with: ${testApp.business_name} (${testApp.email})`);
      
      try {
        // Test auth user creation
        console.log('  - Creating auth user...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: testApp.email,
          password: 'testpass123456',
          options: {
            data: {
              role: 'store_owner'
            }
          }
        });
        
        if (authError) {
          console.log(`  ❌ Auth error: ${authError.message}`);
        } else {
          console.log(`  ✅ Auth user created: ${authData.user?.id}`);
          
          // Test profile creation
          console.log('  - Creating profile...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user?.id,
              email: testApp.email,
              first_name: testApp.contact_person_first_name,
              last_name: testApp.contact_person_last_name,
              phone: testApp.phone,
              role: 'store_owner',
              email_verified: false
            })
            .select()
            .single();
          
          if (profileError) {
            console.log(`  ❌ Profile error: ${profileError.message}`);
            console.log(`  ❌ Error code: ${profileError.code}`);
            console.log(`  ❌ Error details: ${profileError.details}`);
          } else {
            console.log(`  ✅ Profile created: ${profile.id}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Test error: ${error.message}`);
      }
    }
    
    // 4. Check RLS policies
    console.log('\n4. RLS Policy Analysis...');
    console.log('The issue is likely RLS (Row Level Security) policies blocking profile creation.');
    console.log('To fix this, you need to:');
    console.log('1. Go to Supabase Dashboard > Authentication > Policies');
    console.log('2. Find the "profiles" table');
    console.log('3. Add a policy to allow INSERT for authenticated users:');
    console.log(`
    CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (true);
    `);
    console.log('4. Or temporarily disable RLS for testing:');
    console.log('   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
    
    // 5. Check notifications
    console.log('\n5. Checking notifications...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    } else {
      console.log(`Found ${notifications?.length || 0} recent notifications`);
      notifications?.forEach(notif => {
        console.log(`  - ${notif.title}: ${notif.message}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugApprovalWorkflow(); 