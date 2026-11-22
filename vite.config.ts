import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      // The browser only knows Vite's origin; /bff is relayed to ASP.NET Core.
      '/bff': 'http://localhost:5080',
    },
  },
});
