import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_API_PORT ?? 8787}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
