import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysmzgrtfxbtqkaeltoug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAndCreateAdmin() {
  try {
    console.log('Checking for existing admin users...');
    
    // Check for existing admin users
    const { data: adminUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .eq('role', 'admin');
    
    if (checkError) {
      console.error('Error checking admin users:', checkError);
      return;
    }
    
    console.log(`Found ${adminUsers?.length || 0} admin users:`, adminUsers);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found. Creating test admin...');
      
      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@beautyfetch.com',
        password: 'admin123456',
        options: {
          data: {
            role: 'admin'
          }
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return;
      }
      
      console.log('Admin auth user created:', authData.user?.id);
      
      // Create admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          email: 'admin@beautyfetch.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          status: 'active'
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }
      
      console.log('Admin profile created:', profile);
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@beautyfetch.com');
      console.log('Password: admin123456');
    } else {
      console.log('✅ Admin users already exist');
    }
    
    // Check for recent applications
    console.log('\nChecking for recent applications...');
    
    const { data: merchantApps } = await supabase
      .from('merchant_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: driverApps } = await supabase
      .from('driver_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`Recent merchant applications: ${merchantApps?.length || 0}`);
    console.log(`Recent driver applications: ${driverApps?.length || 0}`);
    
    if (merchantApps) {
      merchantApps.forEach(app => {
        console.log(`- Merchant: ${app.business_name} (${app.email}) - Status: ${app.status}`);
      });
    }
    
    if (driverApps) {
      driverApps.forEach(app => {
        console.log(`- Driver: ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndCreateAdmin(); 