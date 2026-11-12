import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const KIT = path.resolve(__dirname, 'src/kit')

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite-cache',
  resolve: {
    alias: [{ find: '@kit', replacement: KIT }],
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  server: { fs: { allow: [__dirname, KIT] } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
