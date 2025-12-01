import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        onstart(args) {
          args.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'chrome130',
  },
})
