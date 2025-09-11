// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars from ../.ignore_files instead of root
  const env = loadEnv(mode, '../.ignore_files', '');

  return {
    plugins: [react()],
    define: {
      // Inject VITE_API_BASE so React can use it
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE),
    },
  };
});
