import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss',
    lightningcss: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://studytrack-api-nu1x.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    cssMinify: 'esbuild',
  },
})