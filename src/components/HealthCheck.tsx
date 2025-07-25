import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/utils/env';

interface HealthCheckProps {
  onHealthy?: () => void;
  onUnhealthy?: (error: string) => void;
}

const HealthCheck: React.FC<HealthCheckProps> = ({ onHealthy, onUnhealthy }) => {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check environment variables
        if (!env.supabaseUrl || !env.supabaseAnonKey) {
          throw new Error('Missing Supabase configuration');
        }

        // Test Supabase connection
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error(`Supabase connection failed: ${error.message}`);
        }

        setStatus('healthy');
        onHealthy?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setStatus('unhealthy');
        onUnhealthy?.(errorMessage);
        console.error('Health check failed:', err);
      }
    };

    checkHealth();
  }, [onHealthy, onUnhealthy]);

  // Only render in development or if unhealthy
  if (env.isProduction && status === 'healthy') {
    return null;
  }

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-md text-sm">
        Checking system health...
      </div>
    );
  }

  if (status === 'unhealthy') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm max-w-xs">
        <div className="font-medium">System Error</div>
        <div className="text-xs mt-1">{error}</div>
      </div>
    );
  }

  if (env.isDevelopment) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md text-sm">
        System healthy ✓
      </div>
    );
  }

  return null;
};

export default HealthCheck; 