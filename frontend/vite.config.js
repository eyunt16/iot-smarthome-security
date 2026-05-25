import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  // Force Vite 8 to pre-bundle recharts and its dependencies.
  // The recharts-shim.js handles the CJS named export issue.
  optimizeDeps: {
    include: [
      'recharts',
      'react-smooth',
    ],
  },
  // THÊM ĐOẠN NÀY ĐỂ TẮT CẢNH BÁO GIỚI HẠN SIZE CỦA VERCEL
  build: {
    chunkSizeWarningLimit: 1600, 
  }
})