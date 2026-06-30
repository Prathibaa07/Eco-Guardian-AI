import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Eco-Guardian-AI/',
  plugins: [react()],
  // Dev server: proxy /api → Flask on :5000
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Production build: output to dist/ (Flask serves this folder)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
