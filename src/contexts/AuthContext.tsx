import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  error: string | null;
  isAdmin: () => boolean;
  isMerchant: () => boolean;
  isDriver: () => boolean;
  isCustomer: () => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryInitialization: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  const retryInitialization = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    setInitialized(false);
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    const initializationTimeout = setTimeout(() => {
      if (!initialized && mounted) {
        console.warn('Auth initialization timeout reached');
        setError('Initialization timeout. Please check your connection.');
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        setError(null);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setError(`Authentication error: ${error.message}`);
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
          setError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          clearTimeout(initializationTimeout);
        }
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.id);
      
      // Don't show loading for already initialized state changes
      if (initialized) {
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
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initializationTimeout);
      subscription.unsubscribe();
    };
  }, [retryCount]); // Add retryCount as dependency

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
    error,
    isAdmin,
    isMerchant,
    isDriver,
    isCustomer,
    signOut,
    refreshProfile,
    retryInitialization
  };

  // Show error state with retry option
  if (error && initialized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            {error}
          </p>
          <div className="space-y-2">
            <button
              onClick={retryInitialization}
              className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => {
                setError(null);
                setInitialized(true);
                setLoading(false);
              }}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while initializing
  if (loading && !initialized) {
    return (
      <LoadingSpinner 
        size="lg" 
        text="Initializing BeautyFetch..." 
        fullScreen 
      />
    );
  }

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
