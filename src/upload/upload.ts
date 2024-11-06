import type { ChunkHashResult } from './hash'
import { pLimit } from '../shared/pLimit'
import { calculateChunksMD5, calculateChunksMD5WithWorkers, calculateLargeFileMD5, defaultChunkSize } from './hash'

type UploadedChunk = Pick<ChunkHashResult, 'hash' | 'index'>

interface FileHashOptions {
  chunkSize?: number
  /** 并发数 */
  concurrency?: number
  /** 重试次数 */
  retries?: number
  /** 错误时是否退出 */
  exitOnError?: boolean
  /** 哈希进度 */
  onHashProgress?: (progress: number) => void
  /** 是否使用 Worker 并行计算哈希 */
  createWorker?: () => Worker
  /** 是否使用 Worker 计算整个文件哈希 */
  createLargeFileHashWorker?: () => Worker
}

interface UploadResult extends ChunkHashResult {
  uploaded: boolean
  uploadChunkResponse: any
}

interface UploadHandlers {
  /** 获取已上传分片 */
  getUploadedChunks?: (fileHash: string) => Promise<UploadedChunk[]>
  /** 上传分片 */
  uploadChunk: (chunk: ChunkHashResult, fileHash: string) => Promise<any>
  /** 合并分片 */
  mergeChunks: (filename: string, fileHash: string, chunks: UploadedChunk[]) => Promise<any>
}

/**
 * 创建文件哈希计算流
 */
export function createFileHashStream(
  file: Blob,
  options: FileHashOptions & {
    uploadedChunks?: UploadedChunk[]
  } = {},
) {
  const {
    chunkSize = defaultChunkSize,
    createWorker,
    onHashProgress,
    uploadedChunks = [],
  } = options
  const uploadedChunkHashes = uploadedChunks.map(chunk => chunk.hash)
  const totalChunks = Math.ceil(file.size / chunkSize)

  return new ReadableStream<ChunkHashResult>({
    async start(controller) {
      try {
        if (createWorker) {
          await calculateChunksMD5WithWorkers(
            file,
            createWorker,
            {
              chunkSize,
              onChunkHashed: (chunks) => {
                const newChunks = chunks.filter(chunk => !uploadedChunkHashes.includes(chunk.hash))
                newChunks.forEach(chunk => controller.enqueue(chunk))
                onHashProgress?.(
                  (chunks.length / totalChunks) * 100,
                )
              },
            },
          )
        }
        else {
          await calculateChunksMD5(
            file,
            chunkSize,
            (chunk) => {
              if (!uploadedChunkHashes.includes(chunk.hash))
                controller.enqueue(chunk)
              onHashProgress?.(
                ((chunk.index + 1) / totalChunks) * 100,
              )
            },
          )
        }
      }
      catch (error) {
        controller.error(error)
      }
      finally {
        controller.close()
      }
    },
  })
}

/**
 * 将哈希计算流转换为上传流，支持并发控制
 * @param uploadChunk 上传分片的处理函数
 * @param options 配置选项（并发数、重试次数、错误处理）
 */
export function hashStreamToUploadStream(
  uploadChunk: UploadHandlers['uploadChunk'],
  fileHash: string,
  options: {
    concurrency?: number
    retries?: number
    exitOnError?: boolean
  } = {},
) {
  // 创建一个具有并发限制的执行器
  const limitedUpload = pLimit(
    options.concurrency || 10,
    options.retries || 0,
    options.exitOnError ?? true,
  )

  // 创建一个队列来存储待上传的分片任务
  const uploadQueue: Promise<UploadResult>[] = []

  // TransformStream 用于转换数据流

  // transform 方法在每次收到新的分片数据时被调用
  // chunk 当前要处理的分片数据（包含哈希值和分片内容）
  // controller 用于控制输出流的控制器
  // 执行顺序
  // 1. transform(chunk1) 进入微任务队列
  // 2. ├── uploadTask1 开始执行（如果失败 pLimit 内部设置 isAborting = true）
  // 3. transform(chunk2) 进入微任务队列
  // 4. └── uploadTask2 直接返回 rejected Promise（因为 isAborting = true）

  // flush 方法在所有数据都已经通过 transform 处理后被调用
  // 用于处理队列中剩余的任务
  // controller 用于控制输出流的控制器
  return new TransformStream<ChunkHashResult, UploadResult>({
    async transform(chunk, controller) {
      // 创建上传任务并用 pLimit 包装以实现并发控制
      const uploadTask = limitedUpload(async () => {
        const uploadChunkResponse = await uploadChunk(chunk, fileHash)
        return {
          ...chunk,
          uploaded: true,
          uploadChunkResponse,
        }
      })
        .catch((error) => {
          // 1. 为所有未完成的任务添加错误处理器，这里不写 node 下测试会报错
          uploadQueue.forEach(task => task.catch(() => {}))
          // 2. 清空队列
          uploadQueue.length = 0
          // 3. 通知错误
          controller.error(error)
          throw error
        })

      // 将任务加入队列，不需要在这里处理错误
      uploadQueue.push(uploadTask)

      // 当队列长度达到并发限制时，处理一个任务
      // 内存控制：避免所有任务同时存在于内存中，当队列达到并发上限时，等待并处理一个任务，释放内存空间
      // 背压（Backpressure）机制：当下游处理较慢时，通过等待处理结果来自动降低上游的处理速度，防止内存中堆积过多的待处理任务
      if (uploadQueue.length >= (options.concurrency || 10)) {
        const result = await uploadQueue.shift()
        controller.enqueue(result)
      }
    },

    async flush(controller) {
      try {
        // 等待所有剩余的上传任务完成
        const results = await Promise.all(uploadQueue)
        // 将所有结果输出到流中
        results.forEach(result => controller.enqueue(result))
      }
      catch (error) {
        // 通知错误并结束流
        controller.error(error)
      }
    },
  })
}

/**
 * 通用的文件分片上传处理流程。
 * 文件 -> ReadableStream(分片+哈希)[hashStream]  -> TransformStream(上传)[uploadStream] -> 结果收集[results]
 */
export async function uploadFileInChunks(
  file: File,
  handlers: UploadHandlers,
  options: FileHashOptions & {
    onUploadProgress?: (progress: number) => void
  } = {},
) {
  const {
    onUploadProgress,
    concurrency,
    retries,
    exitOnError,
    createLargeFileHashWorker,
    ...hashOptions
  } = options

  let hashStream: ReadableStream<ChunkHashResult> | undefined
  let reader: ReadableStreamDefaultReader<UploadResult> | undefined

  try {
    // 计算文件哈希
    const fileHash = await calculateLargeFileMD5(file, {
      createWorker: createLargeFileHashWorker,
    })
    // 获取已上传分片
    const uploadedChunks = await handlers.getUploadedChunks?.(fileHash) || []
    // 1. 创建哈希计算流
    // ReadableStream 用于读取数据，这里用于读取文件分片并计算哈希
    hashStream = createFileHashStream(file, {
      ...hashOptions,
      uploadedChunks,
    })

    // 2. 转换为上传流并处理结果
    const results: UploadResult[] = []
    const totalChunks = Math.ceil(file.size / (options.chunkSize || defaultChunkSize))

    // 使用并发控制的上传流
    // pipeThrough 用于将一个流传输到另一个转换流中
    // 这里将哈希计算流传入上传转换流，形成处理管道：文件分片 -> 计算哈希 -> 上传分片
    const uploadStream = hashStream.pipeThrough(
      hashStreamToUploadStream(handlers.uploadChunk, fileHash, {
        concurrency,
        retries,
        exitOnError,
      }),
    )

    // 获取读取器
    reader = uploadStream.getReader()

    // 循环读取每个上传结果
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      results.push(value)
      onUploadProgress?.(
        ((results.length + uploadedChunks.length) / totalChunks) * 100,
      )
    }

    // 3. 通知服务器合并文件
    const mergeResult = await handlers.mergeChunks(file.name, fileHash, [
      ...results.map(result => ({
        hash: result.hash,
        index: result.index,
      })),
      ...uploadedChunks,
    ])

    return {
      uploadedChunks: results,
      oldUploadedChunks: uploadedChunks,
      mergeResult,
    }
  }
  catch (error) {
    throw new Error(`文件处理失败: ${error instanceof Error ? error.message : String(error)}`)
  }
  finally {
    // hashStream -----> TransformStream -----> reader
    // ^                   |
    // |                   |
    // +------- 取消传播 ------+
    // 先释放读取器的锁
    try {
      reader?.releaseLock()
      // await reader.cancel()
    }
    catch (e) {
      console.warn('释放读取器锁失败:', e)
    }

    // 再取消流，判断流是否被锁定
    if (!hashStream?.locked) {
      try {
        await hashStream?.cancel()
      }
      catch (e) {
        console.warn('取消哈希流失败:', e)
      }
    }
  }
}
