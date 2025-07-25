import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'store_owner' | 'admin' | 'driver';
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: any;
  contact_info: any;
  business_hours: any;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userStore: Store | null;
  loading: boolean;
  initialized: boolean;
  isAdmin: () => boolean;
  isMerchant: () => boolean;
  isDriver: () => boolean;
  isCustomer: () => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // If profile doesn't exist, don't throw error but set null
        if (profileError.code === 'PGRST116') {
          setProfile(null);
          return null;
        }
        throw profileError;
      }

      setProfile(profileData as Profile);
      return profileData as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  const fetchUserStore = async (userId: string) => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (storeError) {
        if (storeError.code === 'PGRST116') {
          setUserStore(null);
          return null;
        }
        throw storeError;
      }

      setUserStore(storeData as Store);
      return storeData as Store;
    } catch (error) {
      console.error('Error fetching store:', error);
      setUserStore(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
      if (profile?.role === 'store_owner') {
        await fetchUserStore(user.id);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setUserStore(null);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          const profileData = await fetchUserProfile(session.user.id);
          
          if (profileData?.role === 'store_owner') {
            await fetchUserStore(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.id);
      
      setLoading(true);
      
      try {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchUserProfile(session.user.id);

          // If merchant, fetch store details
          if (profileData?.role === 'store_owner') {
            await fetchUserStore(session.user.id);
          } else {
            setUserStore(null);
          }

          // Handle driver application status check
          if (profileData?.role !== 'driver') {
            try {
              const { data: application } = await supabase
                .from('driver_applications')
                .select('status')
                .eq('email', session.user.email)
                .single();

              if (application) {
                switch (application.status) {
                  case 'pending':
                    toast.info("Your driver application is pending review.");
                    break;
                  case 'in_review':
                    toast.info("Your application is being reviewed.");
                    break;
                  case 'needs_info':
                    toast.warning("Additional information needed for your application.");
                    break;
                  case 'rejected':
                    toast.error("Your driver application was rejected.");
                    break;
                }
              }
            } catch (error) {
              // Silently handle driver application check errors
              console.log('Driver application check skipped:', error);
            }
          }
        } else {
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Don't show error toast for session handling issues
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = () => profile?.role === 'admin';
  const isMerchant = () => profile?.role === 'store_owner';
  const isDriver = () => profile?.role === 'driver';
  const isCustomer = () => profile?.role === 'customer';

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setUserStore(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    profile,
    userStore,
    loading,
    initialized,
    isAdmin,
    isMerchant,
    isDriver,
    isCustomer,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
