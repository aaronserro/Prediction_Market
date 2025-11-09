// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // everything beginning with /api will be sent to Spring on 8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // if your Spring app is mounted at / (no context-path), keep rewrite commented out.
        // If Spring DOESN'T include /api in controller paths but you want it externally, you can rewrite:
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
