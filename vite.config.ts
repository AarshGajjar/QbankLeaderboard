import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: process.env.NODE_ENV === 'production' ? '/MarrowLeaderboard/' : '/',
    define: {
      // Explicitly define each environment variable
      'process.env.VITE_EMAILJS_SERVICE_ID': JSON.stringify(env.VITE_EMAILJS_SERVICE_ID || ''),
      'process.env.VITE_EMAILJS_TEMPLATE_ID': JSON.stringify(env.VITE_EMAILJS_TEMPLATE_ID || ''),
      'process.env.VITE_EMAILJS_PUBLIC_KEY': JSON.stringify(env.VITE_EMAILJS_PUBLIC_KEY || ''),
    }
  };
});