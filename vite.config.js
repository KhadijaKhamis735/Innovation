import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev server to port 5173 so the URL never silently shifts to a
    // different port (5174, 5175, …) when another tool briefly holds 5173.
    // `strictPort: true` makes Vite fail loudly instead of auto-incrementing.
    port: 5173,
    strictPort: true,
  },
})
