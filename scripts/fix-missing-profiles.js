import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingProfiles() {
  try {
    console.log('Starting profile fix script...');

    // 1. Get all approved merchant applications without profiles
    const { data: merchantApps, error: merchantError } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('status', 'approved');

    if (merchantError) throw merchantError;

    // 2. Get all approved driver applications without profiles
    const { data: driverApps, error: driverError } = await supabase
      .from('driver_applications')
      .select('*')
      .eq('status', 'approved');

    if (driverError) throw driverError;

    console.log(`Found ${merchantApps?.length || 0} merchant applications and ${driverApps?.length || 0} driver applications`);

    // Process merchant applications
    for (const app of (merchantApps || [])) {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', app.email)
          .single();

        if (!existingProfile) {
          console.log(`Creating profile for merchant: ${app.email}`);

          // Create auth user with random password
          const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: app.email,
            password: tempPassword,
            options: {
              data: {
                role: 'store_owner'
              }
            }
          });

          if (authError) throw authError;

          if (authData.user) {
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                first_name: app.contact_person_first_name,
                last_name: app.contact_person_last_name,
                email: app.email,
                phone: app.phone,
                role: 'store_owner',
                status: 'active'
              });

            if (profileError) throw profileError;

            // Create store
            const { error: storeError } = await supabase
              .from('stores')
              .insert({
                owner_id: authData.user.id,
                name: app.business_name,
                slug: app.business_name.toLowerCase().replace(/\s+/g, '-'),
                description: app.business_description,
                address: app.business_address,
                contact_info: {
                  email: app.email,
                  phone: app.phone
                },
                business_hours: {},
                status: 'active'
              });

            if (storeError) throw storeError;

            // Update application with user_id
            await supabase
              .from('merchant_applications')
              .update({ user_id: authData.user.id })
              .eq('id', app.id);

            // Send password reset email
            await supabase.auth.resetPasswordForEmail(app.email, {
              redirectTo: `${process.env.VITE_APP_URL}/auth/reset-password`
            });

            console.log(`✅ Created profile and store for merchant: ${app.email}`);
          }
        } else {
          console.log(`Profile already exists for merchant: ${app.email}`);
        }
      } catch (error) {
        console.error(`Failed to process merchant application ${app.id}:`, error);
      }
    }

    // Process driver applications
    for (const app of (driverApps || [])) {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', app.email)
          .single();

        if (!existingProfile) {
          console.log(`Creating profile for driver: ${app.email}`);

          // Create auth user with random password
          const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: app.email,
            password: tempPassword,
            options: {
              data: {
                role: 'driver'
              }
            }
          });

          if (authError) throw authError;

          if (authData.user) {
            // Create profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                first_name: app.first_name,
                last_name: app.last_name,
                email: app.email,
                phone: app.phone,
                role: 'driver',
                status: 'active'
              });

            if (profileError) throw profileError;

            // Create driver status
            const { error: statusError } = await supabase
              .from('driver_status')
              .insert({
                driver_id: authData.user.id,
                is_online: false,
                last_updated: new Date().toISOString()
              });

            if (statusError) throw statusError;

            // Update application with user_id
            await supabase
              .from('driver_applications')
              .update({ user_id: authData.user.id })
              .eq('id', app.id);

            // Send password reset email
            await supabase.auth.resetPasswordForEmail(app.email, {
              redirectTo: `${process.env.VITE_APP_URL}/auth/reset-password`
            });

            console.log(`✅ Created profile and driver status for driver: ${app.email}`);
          }
        } else {
          console.log(`Profile already exists for driver: ${app.email}`);
        }
      } catch (error) {
        console.error(`Failed to process driver application ${app.id}:`, error);
      }
    }

    console.log('Profile fix script completed!');
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
fixMissingProfiles();
