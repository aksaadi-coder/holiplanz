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
    // Vite doesn't read PORT on its own. Honouring it lets this dev server be
    // assigned a free port when 5173 is already taken, instead of silently
    // landing on 5174 and leaving whoever started it looking at the wrong URL.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
