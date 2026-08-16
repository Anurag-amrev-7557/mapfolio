import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    exclude: ['maplibre-gl', 'cesium', 'zustand', 'pako'],
    include: []
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium/'),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000')
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('maplibre-gl')) {
            return 'maplibre-gl';
          }
        }
      }
    }
  },
  assetsInclude: ['**/*.mjs', '**/*.wasm'],
  publicDir: 'public'
})