import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Esto es redundante si usas import.meta.env.VITE_*, pero útil como respaldo
      define: {
        'process.env': {
            GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
            VITE_GEMINI_API_KEY: JSON.stringify(env.VITE_GEMINI_API_KEY)
        }
      }
    };
});
