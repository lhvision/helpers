import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'rollup-plugin-dts'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

function deleteFolderPlugin(folderPath) {
  return {
    name: 'delete-folder-plugin',
    async buildEnd() {
      await rm(folderPath, { recursive: true })
    },
  }
}

export default [
  {
    input: resolve(rootDir, 'dist/types/index.d.ts'),
    output: {
      file: resolve(rootDir, 'dist/index.d.ts'),
      format: 'es',
    },
    plugins: [dts(), deleteFolderPlugin(resolve(rootDir, 'dist/types'))],
  },
]
