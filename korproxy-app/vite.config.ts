import { defineConfig } from 'vite'
import path from 'node:path'
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

function copyPreload() {
  return {
    name: 'copy-preload',
    buildStart() {
      const srcPath = path.resolve(__dirname, 'electron/preload/index.cjs')
      const destDir = path.resolve(__dirname, 'dist-electron/preload')
      const destPath = path.resolve(destDir, 'index.cjs')
      
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }
      
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath)
        console.log('Copied preload script to', destPath)
      }
    },
  }
}

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
              external: ['electron', 'keytar', 'electron-updater'],
            },
          },
          plugins: [copyPreload()],
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
