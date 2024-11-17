import { processBinaryStream } from '../shared/stream'

export function downloadUrl(url: string, filename?: string) {
  const a = document.createElement('a')
  a.href = url
  if (filename) {
    a.download = filename
  }
  a.click()
}

export function downloadBlob(content: string | Blob, filename?: string): void {
  const blob = typeof content === 'string' ? new Blob([content]) : content
  const blobUrl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = blobUrl
  if (filename) {
    a.download = filename
  }
  document.body.appendChild(a)
  a.click()

  URL.revokeObjectURL(blobUrl)
  document.body.removeChild(a)
}

/**
 * 使用流式方式下载文件
 * @param response fetch Response 对象
 * @param filename 保存的文件名
 */
export async function streamDownload(response: Response, filename?: string) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const chunks: Uint8Array[] = []
  await processBinaryStream(response, (chunk) => {
    chunks.push(chunk)
  })

  const blob = new Blob(chunks)
  downloadBlob(blob, filename)
}

/**
 * 带进度的文件下载函数
 * @param response fetch Response 对象
 * @param onProgress 下载进度回调函数，参数为当前下载进度(0-100)
 * @param filename 可选的文件名
 */
export async function downloadWithProgress(
  response: Response,
  onProgress: (progress: number) => void,
  filename?: string,
) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const total = Number(response.headers.get('content-length'))
  let loaded = 0
  const chunks: Uint8Array[] = []

  await processBinaryStream(response, (chunk) => {
    chunks.push(chunk)
    loaded += chunk.length
    const progress = (loaded / total) * 100
    onProgress(progress)
  })

  const blob = new Blob(chunks)
  downloadBlob(blob, filename)
}
