import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde red local e Internet (0.0.0.0)
    port: 5173,
    allowedHosts: true, // Permite dominios de túneles (Cloudflare, ngrok, localtunnel, etc.)
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
