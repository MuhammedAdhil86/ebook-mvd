// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dns from 'dns';

// Force Node to prefer 'localhost' over the IP address
dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // Errors out if 5173 is busy (prevents port 5174)
    host: 'localhost', // Ensures the origin header is always 'localhost'
  },
});