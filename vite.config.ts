import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'APTUM',
        short_name: 'APTUM',
        theme_color: '#0b65c2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    allowedHosts: [
      '5173-ixt7cg62aq3fulcszxv66-6532622b.e2b.dev',
      '5174-ixt7cg62aq3fulcszxv66-6532622b.e2b.dev'
    ]
  }
});
