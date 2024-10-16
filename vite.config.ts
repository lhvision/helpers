/// <reference types="vitest" />
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        browser: resolve(__dirname, 'src/browser/index.ts'),
        node: resolve(__dirname, 'src/node/index.ts'),
        common: resolve(__dirname, 'src/common/index.ts'),
      },
      name: '@lhvision/helpers',
      formats: ['es', 'cjs'],
    },
  },
})
