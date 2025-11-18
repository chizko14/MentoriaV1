import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Cargar variables de entorno basadas en el modo actual
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Inyectar variables de entorno de manera segura para el navegador
        // IMPORTANTE: Usar JSON.stringify para evitar errores de sintaxis
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || ""),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || "")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        // Asegurar que el build no falle por warnings pequeños
        commonjsOptions: {
            transformMixedEsModules: true,
        }
      }
    };
});
});
