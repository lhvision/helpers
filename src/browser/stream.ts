type StreamCallback<T> = (chunk: T) => void | Promise<void>

/**
 * 处理文本流
 * @param response Fetch Response 对象
 * @param onChunk 处理每个文本块的回调
 */
export async function processTextStream(
  response: Response,
  onChunk: StreamCallback<string>,
) {
  const reader = response.body?.getReader()
  if (!reader)
    throw new Error('ReadableStream not supported')

  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      const text = decoder.decode(value, { stream: true })
      await onChunk(text)
    }
  }
  finally {
    reader.releaseLock()
  }
}

/**
 * 处理二进制流
 * @param response Fetch Response 对象
 * @param onChunk 处理每个二进制块的回调
 */
export async function processBinaryStream(
  response: Response,
  onChunk: StreamCallback<Uint8Array>,
) {
  const reader = response.body?.getReader()
  if (!reader)
    throw new Error('ReadableStream not supported')

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      await onChunk(value)
    }
  }
  finally {
    reader.releaseLock()
  }
}
