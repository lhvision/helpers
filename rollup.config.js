import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'rollup-plugin-dts'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

function deleteFolderPlugin(folderPath) {
  return {
    name: 'delete-folder-plugin',
    async buildEnd() {
      await rm(folderPath, { recursive: true, force: true })
    },
  }
}

export default [
  {
    input: {
      index: resolve(rootDir, 'dist/types/index.d.ts'),
      browser: resolve(rootDir, 'dist/types/browser/index.d.ts'),
      node: resolve(rootDir, 'dist/types/node/index.d.ts'),
      shared: resolve(rootDir, 'dist/types/shared/index.d.ts'),
    },
    output: {
      dir: resolve(rootDir, 'dist'),
      format: 'es',
    },
    plugins: [dts(), deleteFolderPlugin(resolve(rootDir, 'dist/types'))],
  },
]
