import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "../integrations/supabase/client";

type DriverApplication = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  driver_license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_color: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: any;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MerchantApplication = {
  id: string;
  business_name: string;
  business_type: string | null;
  contact_person_first_name: string;
  contact_person_last_name: string;
  email: string;
  phone: string;
  business_address: any;
  business_description: string | null;
  estimated_monthly_revenue: number | null;
  previous_experience: string | null;
  business_license_number: string | null;
  tax_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function createUserProfile(email: string, role: 'driver' | 'store_owner', data: DriverApplication | MerchantApplication) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
      options: {
        data: {
          role
        }
      }
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user?.id,
        email,
        first_name: 'first_name' in data ? data.first_name : data.contact_person_first_name,
        last_name: 'last_name' in data ? data.last_name : data.contact_person_last_name,
        phone: data.phone,
        role,
        email_verified: false
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: profile.id,
        title: `Welcome to BeautyFetch`,
        message: `Your account has been created. Please check your email for login instructions.`,
        type: 'welcome'
      });

    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function handleApplicationApproval(type: 'driver' | 'merchant', id: string, reviewData: any) {
  try {
    // Get application data
    const { data: application, error: appError } = await supabase
      .from(type === 'driver' ? 'driver_applications' : 'merchant_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError) throw appError;

    // Update application status
    const { error: updateError } = await supabase
      .from(type === 'driver' ? 'driver_applications' : 'merchant_applications')
      .update(reviewData)
      .eq('id', id);

    if (updateError) throw updateError;

    if (reviewData.status === 'approved') {
      // Create user profile
      const profile = await createUserProfile(
        application.email,
        type === 'driver' ? 'driver' : 'store_owner',
        application as DriverApplication | MerchantApplication
      );

      if (type === 'merchant' && 'business_name' in application) {
        // Create store for merchant
        const { error: storeError } = await supabase
          .from('stores')
          .insert({
            name: application.business_name,
            slug: application.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: application.business_description,
            owner_id: profile.id,
            address: application.business_address,
            phone: application.phone,
            email: application.email,
            status: 'active'
          });

        if (storeError) throw storeError;
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        application.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      );

      if (resetError) throw resetError;
    }

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: id, // Using application ID until profile is created
        title: `${type === 'driver' ? 'Driver' : 'Store'} Application ${reviewData.status}`,
        message: `Your ${type} application has been ${reviewData.status}. ${
          reviewData.status === 'approved' 
            ? 'Please check your email for login instructions.' 
            : reviewData.status === 'needs_info'
            ? 'Please provide the requested information.'
            : 'Please contact support for more information.'
        }`,
        type: `${type}_application`,
        related_id: id
      });

    // Notify admins of new approval
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      await Promise.all(admins.map(admin => 
        supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            title: `${type === 'driver' ? 'Driver' : 'Store'} Application ${reviewData.status}`,
            message: `${
              'first_name' in application 
                ? application.first_name 
                : application.contact_person_first_name
            } ${
              'last_name' in application 
                ? application.last_name 
                : application.contact_person_last_name
            }'s application has been ${reviewData.status}.`,
            type: `${type}_application_review`,
            related_id: id
          })
      ));
    }

    return true;
  } catch (error) {
    console.error(`Error handling ${type} application approval:`, error);
    throw error;
  }
}

export async function fixMissingProfiles() {
  try {
    // Get approved applications without profiles
    const { data: approvedMerchants, error: merchantError } = await supabase
      .from('merchant_applications')
      .select(`
        *,
        profiles!inner(id)
      `)
      .eq('status', 'approved');

    if (merchantError) throw merchantError;

    const { data: approvedDrivers, error: driverError } = await supabase
      .from('driver_applications')
      .select(`
        *,
        profiles!inner(id)
      `)
      .eq('status', 'approved');

    if (driverError) throw driverError;

    // Create missing profiles and stores
    for (const merchant of approvedMerchants || []) {
      try {
        const profile = await createUserProfile(
          merchant.email,
          'store_owner',
          merchant as MerchantApplication
        );

        // Create store
        await supabase
          .from('stores')
          .insert({
            name: merchant.business_name,
            slug: merchant.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: merchant.business_description,
            owner_id: profile.id,
            address: merchant.business_address,
            phone: merchant.phone,
            email: merchant.email,
            status: 'active'
          });
      } catch (error) {
        console.error(`Error fixing merchant ${merchant.id}:`, error);
      }
    }

    for (const driver of approvedDrivers || []) {
      try {
        await createUserProfile(
          driver.email,
          'driver',
          driver as any
        );
      } catch (error) {
        console.error(`Error fixing driver ${driver.id}:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error fixing missing profiles:', error);
    throw error;
  }
}
