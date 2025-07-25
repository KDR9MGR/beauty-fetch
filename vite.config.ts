import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      },
      middleware: [
        ((req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method === 'GET' && !req.url?.includes('.')) {
            req.url = '/index.html';
          }
          next();
        }) as Connect.NextHandleFunction
      ]
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      minify: mode === 'production',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor';
              }
              if (id.includes('@radix-ui/') || id.includes('@shadcn/')) {
                return 'ui';
              }
              return 'deps';
            }
          }
        },
      },
    },
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        plugins: [['@swc/plugin-emotion', {}]],
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['@supabase/supabase-js']
    },
    preview: {
      port: 8080,
      strictPort: true,
    },
    define: {
      __VITE_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
      __VITE_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      __VITE_STRIPE_PUBLISHABLE_KEY__: JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
    }
  };
});
