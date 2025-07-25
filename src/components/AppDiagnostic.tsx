import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticInfo {
  timestamp: string;
  supabaseConnection: 'success' | 'error' | 'testing';
  environmentVariables: Record<string, string | undefined>;
  authState: any;
  errors: string[];
}

const AppDiagnostic: React.FC = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo>({
    timestamp: new Date().toISOString(),
    supabaseConnection: 'testing',
    environmentVariables: {},
    authState: null,
    errors: []
  });
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    const runDiagnostic = async () => {
      const errors: string[] = [];
      
      try {
        // Test environment variables
        const envVars = {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
          VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          MODE: import.meta.env.MODE,
          NODE_ENV: import.meta.env.NODE_ENV
        };

        // Test Supabase connection
        let supabaseStatus: 'success' | 'error' = 'error';
        let authState = null;
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          authState = session;
          supabaseStatus = 'success';
        } catch (error) {
          errors.push(`Supabase connection failed: ${error}`);
        }

        setDiagnostic({
          timestamp: new Date().toISOString(),
          supabaseConnection: supabaseStatus,
          environmentVariables: envVars,
          authState,
          errors
        });

      } catch (error) {
        errors.push(`Diagnostic failed: ${error}`);
        setDiagnostic(prev => ({ ...prev, errors }));
      }
    };

    runDiagnostic();

    // Show diagnostic if there are errors or if we're in development
    if (import.meta.env.MODE === 'development') {
      // Auto-show after 3 seconds if page seems broken
      const timer = setTimeout(() => {
        const appContent = document.querySelector('main');
        if (!appContent || appContent.children.length === 0) {
          setShowDiagnostic(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Add keyboard shortcut to toggle diagnostic
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDiagnostic(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!showDiagnostic) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 9999,
        background: '#f3f4f6',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        Press Ctrl+Shift+D for diagnostic
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>App Diagnostic</h2>
          <button 
            onClick={() => setShowDiagnostic(false)}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '4px 8px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>Timestamp:</strong> {diagnostic.timestamp}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>Supabase Connection:</strong> 
          <span style={{ 
            color: diagnostic.supabaseConnection === 'success' ? '#10b981' : '#ef4444',
            marginLeft: '8px'
          }}>
            {diagnostic.supabaseConnection}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>Environment Variables:</strong>
          <pre style={{ 
            backgroundColor: '#f9fafb', 
            padding: '12px', 
            borderRadius: '4px', 
            fontSize: '11px',
            overflow: 'auto'
          }}>
            {JSON.stringify(diagnostic.environmentVariables, null, 2)}
          </pre>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <strong>Auth State:</strong>
          <pre style={{ 
            backgroundColor: '#f9fafb', 
            padding: '12px', 
            borderRadius: '4px', 
            fontSize: '11px',
            overflow: 'auto'
          }}>
            {JSON.stringify(diagnostic.authState, null, 2)}
          </pre>
        </div>

        {diagnostic.errors.length > 0 && (
          <div>
            <strong style={{ color: '#ef4444' }}>Errors:</strong>
            <ul style={{ color: '#ef4444', marginTop: '8px' }}>
              {diagnostic.errors.map((error, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
          <p>If the app is showing a blank page, this diagnostic can help identify the issue.</p>
          <p>Press Ctrl+Shift+D to toggle this diagnostic panel.</p>
        </div>
      </div>
    </div>
  );
};

export default AppDiagnostic; 