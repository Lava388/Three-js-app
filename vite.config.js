import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0 // Optional: for better asset handling
  },
  server: {
    host: true // Allow external access
  }
})