import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tamaguiPlugins = tamaguiPlugin({
  config: './src/tamagui.config.ts',
  components: ['tamagui'],
})

export default defineConfig({
  plugins: [react(), ...(Array.isArray(tamaguiPlugins) ? tamaguiPlugins : [tamaguiPlugins])],
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
            if (id.includes('@tamagui') || id.includes('/tamagui/')) return 'tamagui'
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor'
            if (id.includes('react-router')) return 'react-router'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
