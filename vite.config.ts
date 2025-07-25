import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add fallback for SPA routing
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    middleware: [
      ((req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        // Handle SPA routing
        if (req.method === 'GET' && !req.url?.includes('.')) {
          req.url = '/index.html';
        }
        next();
      }) as Connect.NextHandleFunction
    ]
  },
  // Add build configuration for production
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
          // Vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            // UI components chunk
            if (id.includes('@radix-ui/') || id.includes('@shadcn/')) {
              return 'ui';
            }
            // Other dependencies
            return 'deps';
          }
        }
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
}));
