import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify - file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    /** Navigateurs récents : moins de transpilation / polyfills → JS un peu plus léger. */
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            id.includes('/react/') ||
            id.includes('\\react\\')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('motion') ||
            id.includes('framer-motion') ||
            id.includes('gsap')
          ) {
            return 'motion-libs';
          }
          if (id.includes('lenis')) {
            return 'lenis';
          }
        },
      },
    },
  },
});
