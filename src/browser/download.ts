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

interface DownloadResult {
  loaded: number
  chunks: Uint8Array[]
  headers: Headers
}

interface DownloadOptions {
  filename?: string
  onProgress?: (progress: number) => void
  startByte?: number
  initialChunks?: Uint8Array[]
}

/**
 * 使用流式方式下载文件，为 response 添加 headers 并传入 startByte、initialChunks 支持断点续传
 * @param response fetch Response 对象
 * @param filename 可选的文件名
 * @param onProgress 下载进度回调函数，参数为当前下载进度(0-100)
 * @param startByte 开始下载的字节数
 * @param initialChunks 初始的已下载字节数组
 */
export function streamDownload(
  response: Response,
  options?: Pick<DownloadOptions, 'onProgress' | 'filename'>
): Promise<void>
export function streamDownload(
  response: Response,
  options?: DownloadOptions
): Promise<DownloadResult>
export async function streamDownload(
  response: Response,
  options?: DownloadOptions,
): Promise<void | DownloadResult> {
  const {
    filename,
    onProgress,
    startByte = 0,
    initialChunks = [],
  } = options || {}

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const total = Number(response.headers.get('content-length'))
  let loaded = startByte
  const chunks: Uint8Array[] = [...initialChunks]

  try {
    await processBinaryStream(response, (chunk) => {
      chunks.push(chunk)
      if (onProgress) {
        loaded += chunk.length
        const progress = (loaded / total) * 100
        onProgress(progress)
      }
    })

    const blob = new Blob(chunks)
    downloadBlob(blob, filename)
  }
  catch {
    const headers = new Headers()
    headers.append('Range', `bytes=${loaded}-`)
    return { loaded, chunks, headers }
  }
}
