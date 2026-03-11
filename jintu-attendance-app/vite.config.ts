import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'xlsx'
            if (id.includes('exceljs')) return 'exceljs'
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('@radix-ui')) return 'radix'
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor'
            if (id.includes('react-router')) return 'react-router'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
