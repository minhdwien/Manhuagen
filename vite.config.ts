import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Property 'cwd' does not exist on type 'Process'. Using (process as any).cwd() to resolve.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CRITICAL FIX: The screenshot shows the user defined 'api_key' (lowercase) in Vercel.
  // We must check for both 'API_KEY' and 'api_key' to ensure the key is picked up regardless of casing.
  const rawApiKey = process.env.API_KEY || process.env.api_key || env.API_KEY || env.api_key || '';
  
  // Trim whitespace just in case of copy-paste errors
  const apiKey = rawApiKey.trim();

  return {
    plugins: [react()],
    define: {
      // Inject the key as a string literal. 
      // If missing, inject an empty string so the code doesn't crash on ReferenceError at runtime, 
      // allowing our service code to catch it and show a helpful message.
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
    }
  };
});