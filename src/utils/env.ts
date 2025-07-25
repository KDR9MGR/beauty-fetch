// Environment validation utility
export const validateEnvironment = () => {
  const requiredEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    // Don't throw error in production, use fallback values
    if (import.meta.env.MODE === 'development') {
      console.warn('Using fallback environment values for development');
    }
  }

  return {
    supabaseUrl: requiredEnvVars.VITE_SUPABASE_URL || "https://ysmzgrtfxbtqkaeltoug.supabase.co",
    supabaseAnonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbXpncnRmeGJ0cWthZWx0b3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTQzMzcsImV4cCI6MjA2Mjk3MDMzN30.C6WxgdAj3g7fk1IsQRufUhckn-n_eOta_8vR_PVY0d8",
    stripePublishableKey: requiredEnvVars.VITE_STRIPE_PUBLISHABLE_KEY || '',
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
  };
};

export const env = validateEnvironment(); 