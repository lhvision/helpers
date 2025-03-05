/**
 * 流数据类型
 */
export interface StreamData<T> {
  done: boolean
  value: T | undefined
}

/**
 * 创建基础流
 * @param reader ReadableStreamDefaultReader 对象
 */
export async function* createBaseStream<T>(reader: ReadableStreamDefaultReader<T>): AsyncGenerator<T> {
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break
      if (!value)
        continue
      yield value
    }
  }
  finally {
    reader.releaseLock()
  }
}

/**
 * 创建文本流
 * @param readableStream Fetch Response.body
 */
export async function* createTextStream(readableStream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const textDecoderStream = new TextDecoderStream()

  const reader = readableStream.pipeThrough(textDecoderStream).getReader()

  yield * createBaseStream(reader)
}

/**
 * 创建二进制流
 * @param readableStream Fetch Response.body
 */
export async function* createBinaryStream(readableStream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = readableStream.getReader()

  yield * createBaseStream(reader)
}

// sse stream

const SSE_CONSTANTS = {
  SEPARATORS: {
    STREAM: '\n\n',
    PART: '\n',
    KV: ':',
  },
  ENCODING: 'utf-8',
} as const

export type SSEFields = 'data' | 'event' | 'id' | 'retry'

export type SSEOutput = Partial<Record<SSEFields, any>>

/**
 * 验证字符串是否有效(非空且非纯空白)
 */
const isValidString = (str: string) => (str ?? '').trim() !== ''

/**
 * 创建支持异步迭代的流
 */
export function createAsyncIterableStream<T>(stream: ReadableStream<T>): ReadableStream<T> & AsyncIterable<T> {
  return Object.assign(stream, {
    async *[Symbol.asyncIterator]() {
      yield * createBaseStream(stream.getReader())
    },
  })
}

/**
 * 创建 SSE 事件分割流
 */
function createEventSplitStream() {
  let buffer = ''
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk
      // 将数据流按照分隔符拆分
      const parts = buffer.split(SSE_CONSTANTS.SEPARATORS.STREAM)
      // 将拆分后的数据流按照分隔符拆分
      parts.slice(0, -1).forEach((part) => {
        // 忽略无效数据
        if (isValidString(part)) {
          controller.enqueue(part)
        }
      })
      // 将最后一个数据流作为缓冲区
      buffer = parts[parts.length - 1]
    },
    flush(controller) {
      // 处理最后一个数据流
      if (isValidString(buffer)) {
        // 将最后一个数据流作为输出
        controller.enqueue(buffer)
      }
    },
  })
}

/**
 * 创建 SSE 事件解析流
 */
function createEventParseStream() {
  return new TransformStream<string, SSEOutput>({
    transform(chunk, controller) {
      // 将数据流按照分隔符拆分
      const event = chunk
        .split(SSE_CONSTANTS.SEPARATORS.PART)
        // 将数据流按照键值对拆分
        .reduce<SSEOutput>((acc, line) => {
          // 忽略注释
          const colonIndex = line.indexOf(SSE_CONSTANTS.SEPARATORS.KV)
          // 忽略无效数据
          if (colonIndex === -1)
            return acc
          // 将数据流按照键值对拆分
          const key = line.slice(0, colonIndex).trim() as SSEFields
          const value = line.slice(colonIndex + 1).trimStart()
          // 忽略无效数据
          return key ? { ...acc, [key]: value } : acc
        }, {})

      if (Object.keys(event).length > 0) {
        // 将解析后的数据流作为输出
        controller.enqueue(event)
      }
    },
  })
}

/**
 * 创建 SSE 流
 * @param readableStream Fetch Response.body
 * @param transformStream 自定义转换流
 */
export function createSSEStream<T = SSEOutput>(readableStream: ReadableStream<Uint8Array>, transformStream?: TransformStream<string, T>) {
  const textDecoderStream = new TextDecoderStream()

  // 创建数据流
  const stream = transformStream
    ? readableStream.pipeThrough(textDecoderStream).pipeThrough(transformStream)
    : readableStream
        .pipeThrough(textDecoderStream)
        .pipeThrough(createEventSplitStream())
        .pipeThrough(createEventParseStream() as TransformStream<string, T>)

  return createAsyncIterableStream(stream)
}

// type StreamCallback<T> = (chunk: T) => void | Promise<void>

/**
 * 处理文本流
 * @param response Fetch Response 对象
 * @param onChunk 处理每个文本块的回调
 */
// export async function processTextStream(
//   response: Response,
//   onChunk: StreamCallback<string>,
// ) {
//   const reader = response.body?.getReader()
//   if (!reader)
//     throw new Error('ReadableStream not supported')

//   const decoder = new TextDecoder()

//   try {
//     while (true) {
//       const { done, value } = await reader.read()
//       if (done)
//         break

//       const text = decoder.decode(value, { stream: true })
//       await onChunk(text)
//     }
//   }
//   finally {
//     reader.releaseLock()
//   }
// }

/**
 * 处理二进制流
 * @param response Fetch Response 对象
 * @param onChunk 处理每个二进制块的回调
 */
// export async function processBinaryStream(
//   response: Response,
//   onChunk: StreamCallback<Uint8Array>,
// ) {
//   const reader = response.body?.getReader()
//   if (!reader)
//     throw new Error('ReadableStream not supported')

//   try {
//     while (true) {
//       const { done, value } = await reader.read()
//       if (done)
//         break

//       await onChunk(value)
//     }
//   }
//   finally {
//     reader.releaseLock()
//   }
// }
