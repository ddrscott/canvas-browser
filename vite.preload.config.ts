import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@public': path.resolve(__dirname, './public')
    }
  },
  publicDir: 'public',
});