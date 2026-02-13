import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Property 'cwd' does not exist on type 'Process'. Using (process as any).cwd() to resolve.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize system env (Vercel) -> .env file
  // This ensures that if defined in Vercel Settings, it takes precedence.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Inject the key as a string literal. 
      // If missing, inject an empty string so the code doesn't crash on ReferenceError at runtime, 
      // allowing our service code to catch it and show a helpful message.
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    },
    build: {
      outDir: 'dist',
    }
  };
});