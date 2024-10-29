import type { IDataType } from 'hash-wasm/dist/lib/util'
import type { IHasher } from 'hash-wasm/dist/lib/WASMInterface'

let onCreateMD5: () => Promise<IHasher>
let onMD5: (data: IDataType) => Promise<string>

let isInit = false
export async function initHashWASM() {
  if (!isInit) {
    try {
      const { md5, createMD5 } = await import('hash-wasm')
      if (!isInit) {
        onCreateMD5 = createMD5
        onMD5 = md5
        isInit = true
      }
    }
    catch (error: any) {
      throw new Error(
        `Failed to load hash-wasm. Please ensure that hash-wasm is installed: npm install hash-wasm, ${error?.message}`,
      )
    }
  }
}

export async function hashWASMMD5(buffer: ArrayBuffer): Promise<string> {
  if (!isInit) {
    await initHashWASM()
  }
  return onMD5(new Uint8Array(buffer))
}

function hashChunk(file: Blob): Promise<Uint8Array> {
  const fileReader = new FileReader()

  return new Promise((resolve, reject) => {
    fileReader.onload = (e) => {
      resolve(new Uint8Array(e.target?.result as ArrayBuffer))
    }

    fileReader.onerror = () => {
      reject(new Error('File reading failed'))
    }

    fileReader.readAsArrayBuffer(file)
  })
}

let hasher: IHasher | null = null
const defaultChunkSize = 64 * 1024 * 1024
/**
 * 获取大文件 hash
 * @defaultValue chunkSize 64M
 * @returns hash
 */
export async function largeFileHashWASMMD5(
  file: Blob,
  chunkSize = defaultChunkSize,
) {
  if (!isInit) {
    await initHashWASM()
  }
  if (hasher) {
    hasher.init()
  }
  else {
    hasher = await onCreateMD5()
  }

  const chunkNumber = Math.floor(file.size / chunkSize)

  for (let i = 0; i <= chunkNumber; i++) {
    const chunk = file.slice(
      chunkSize * i,
      Math.min(chunkSize * (i + 1), file.size),
    )
    const view = await hashChunk(chunk)
    hasher.update(view)
  }

  const hash = hasher.digest()

  return Promise.resolve(hash)
}
