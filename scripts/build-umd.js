import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function buildUMD() {
  await build({
    configFile: false,
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, '../src/global.ts'),
        name: 'lhvision',
        formats: ['umd'],
        fileName: format => `lhvision.${format}.js`,
      },
      rollupOptions: {
        external: ['hash-wasm'], // 外部依赖
        output: {
          globals: {
            'hash-wasm': 'hashwasm',
          },
        },
      },
    },
  })
}

buildUMD()
