/// <reference types="vitest" />
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// eslint-disable-next-line node/prefer-global/process
const isDev = process.env.__DEV__ === 'true'
const external = isDev ? undefined : ['hash-wasm']

export default defineConfig({
  build: {
    sourcemap: isDev,
    // 构建时清空目录
    // emptyOutDir: !isDev,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        browser: resolve(__dirname, 'src/browser/index.ts'),
        node: resolve(__dirname, 'src/node/index.ts'),
        shared: resolve(__dirname, 'src/shared/index.ts'),
        upload: resolve(__dirname, 'src/upload/index.ts'),
        request: resolve(__dirname, 'src/request/index.ts'),
      },
      name: '@lhvision/helpers',
      formats: ['es'],
    },
    rollupOptions: {
      external,
    },
  },
  // worker: {
  //   format: 'es',
  //   rollupOptions: {
  //     external,
  //     output: {
  //       format: 'es',
  //     },
  //   },
  // },
})
