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

const inputDirector = ['browser', 'shared', 'upload']

const input = inputDirector.reduce((acc, cur) => {
  acc[cur] = resolve(rootDir, `dist/types/${cur}/index.d.ts`)
  return acc
}, {
  index: resolve(rootDir, 'dist/types/index.d.ts'),
})

export default [
  {
    input,
    output: {
      dir: resolve(rootDir, 'dist'),
      format: 'es',
    },
    plugins: [dts(), deleteFolderPlugin(resolve(rootDir, 'dist/types'))],
  },
]
