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
    /** Ne pas précharger les chunks lazy (carte, actes, menu…) au premier paint. */
    modulePreload: {
      resolveDependencies(_filename, deps) {
        const defer =
          /PoetryGame|AlgeriaMap|Act2|Act3Writing|SystemMenu|IntroVideoOverlay|OrientationPanel|wordTooltipLocale|algeriaOutlinePath/i;
        return deps.filter((dep) => !defer.test(dep));
      },
    },
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
          if (id.includes('howler')) {
            return 'howler';
          }
        },
      },
    },
  },
});
