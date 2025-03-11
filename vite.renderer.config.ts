import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  // Add React plugin for JSX transformation
  plugins: [react()],
  // Enable optimizations for TLDraw
  optimizeDeps: {
    include: ['@tldraw/tldraw', 'react', 'react-dom'],
  },
  // Configure CSS processing with PostCSS for Tailwind
  css: {
    postcss: './postcss.config.js',
  },
});
