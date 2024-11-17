import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { processBinaryStream } from '@lhvision/helpers/shared'

/**
 * Node端下载文件到指定路径
 * @param response fetch Response 对象
 * @param filepath 保存文件的完整路径
 * @param onProgress 可选的进度回调函数，可以结合 cli-progress 库使用
 */
export async function downloadToFile(
  response: Response,
  filepath: string,
  onProgress?: (total: number, loaded: number) => void,
) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // 确保目标目录存在
  await mkdir(dirname(filepath), { recursive: true })

  const total = Number(response.headers.get('content-length'))
  let loaded = 0

  const writeStream = createWriteStream(filepath)

  try {
    await processBinaryStream(response, (chunk) => {
      writeStream.write(chunk)

      if (onProgress && total) {
        loaded += chunk.length
        // const progress = (loaded / total) * 100
        onProgress(total, loaded)
      }
    })
  }
  finally {
    writeStream.end()
  }
}
