import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so the dev server is reachable from a phone on
    // the same Wi-Fi at http://<your-mac-ip>:5173 (the /api proxy carries the
    // backend, so only this one URL is needed on the device).
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
