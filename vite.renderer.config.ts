import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  // Configure static asset handling
  build: {
    assetsDir: 'assets',
  },
  // Set up path aliases for easier imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@public': path.resolve(__dirname, './public')
    }
  },
  // Set the public directory to ensure assets are copied to build
  publicDir: 'public',
});