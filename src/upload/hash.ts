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
    catch (error) {
      throw new Error(`Failed to load hash-wasm. Please ensure that hash-wasm is installed: pnpm add hash-wasm, ${error}`)
    }
  }
}

export async function calculateMD5(buffer: ArrayBuffer): Promise<string> {
  if (!isInit) {
    await initHashWASM()
  }
  return onMD5(new Uint8Array(buffer))
}

function readChunkAsUint8Array(file: Blob): Promise<Uint8Array> {
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
const defaultWASMMD5ChunkSize = 64 * 1024 * 1024
/**
 * 获取大文件 hash
 * @defaultValue chunkSize 64M
 * @returns hash
 */
export async function calculateStreamMD5(
  file: Blob,
  chunkSize = defaultWASMMD5ChunkSize,
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
    const view = await readChunkAsUint8Array(chunk)
    hasher.update(view)
  }

  const hash = hasher.digest()

  return Promise.resolve(hash)
}

export interface ChunkWorkerMessage {
  file: Blob
  startChunkIndex: number
  endChunkIndex: number
  chunkSize: number
}

// export interface SharedWorkerMessage {
//   index: number
//   chunkStart: number
//   chunkEnd: number
//   blob: Blob
// }

export interface ChunkHashResult {
  index: number
  chunkStart: number
  chunkEnd: number
  hash: string
  blob: Blob
}

export const defaultChunkSize = 4 * 1024 * 1024

function calculateChunkBounds(i: number, chunkSize: number, fileSize: number) {
  const chunkStart = i * chunkSize
  const chunkEnd = Math.min(chunkStart + chunkSize, fileSize)
  return { chunkStart, chunkEnd }
}

/**
 * 使用 Web Worker 获取大文件 hash
 * @param createWorker 可以使用 pnpm helpers [options] [targetDir="src/worker"] 创建一个 worker 实现
 * @defaultValue chunkSize 64M
 * @returns hash
 */
export function calculateMD5WithWorker(
  file: Blob,
  createWorker: () => Worker,
  chunkSize = defaultWASMMD5ChunkSize,
) {
  return new Promise<string>((resolve, reject) => {
    const worker = createWorker()

    worker.onmessage = (event) => {
      const { hash } = event.data
      worker.terminate()
      resolve(hash)
    }

    worker.onerror = error => reject(error)

    worker.postMessage({ file, chunkSize })
  })
}

/**
 * 计算整个文件的哈希值，按照文件大小选择不同的计算方式
 * @param file 要计算哈希的文件
 * @returns 文件的 MD5 哈希值
 */
export async function calculateLargeFileMD5(
  file: Blob,
  options: {
    /** 使用 Worker 的文件大小阈值（字节），默认 200MB */
    workerThreshold?: number
    /** 分块大小，默认 64MB */
    chunkSize?: number
    /** worker 创建函数 */
    createWorker?: () => Worker
  } = {},
) {
  const {
    workerThreshold = 200 * 1024 * 1024,
    chunkSize = defaultWASMMD5ChunkSize,
    createWorker,
  } = options

  // 如果文件小于阈值直接使用 calculateMD5 方法
  if (file.size < workerThreshold) {
    return calculateMD5(await file.arrayBuffer())
  }

  // 使用单线程流式处理大文件方法
  if (!createWorker) {
    return calculateStreamMD5(file, chunkSize)
  }

  // 否则使用 Worker 方法
  return calculateMD5WithWorker(file, createWorker, chunkSize)
}

/**
 * 分割大文件，计算每个分片的 MD5 值。
 * @param chunkSize 分片大小，默认为 4MB
 * @param onChunkHashed 每一个分片计算完成后的回调函数，参数为计算结果
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
export async function calculateChunksMD5(
  file: Blob,
  chunkSize = defaultChunkSize,
  onChunkHashed?: (result: ChunkHashResult) => void,
) {
  const chunkCount = Math.ceil(file.size / chunkSize)
  const results: ChunkHashResult[] = Array.from({ length: chunkCount })

  for (let i = 0; i < chunkCount; i++) {
    const { chunkStart, chunkEnd } = calculateChunkBounds(i, chunkSize, file.size)
    const blob = file.slice(chunkStart, chunkEnd)
    const arrayBuffer = await blob.arrayBuffer()
    const hash = await calculateMD5(arrayBuffer)
    const result = { index: i, chunkStart, chunkEnd, hash, blob }
    onChunkHashed?.(result)
    results[i] = result
  }

  return results
}

interface ChunkWorkerOptions {
  /** 最大重试次数 */
  maxRetries?: number
  /**
   * 是否在错误时中止所有worker
   * @defaultValue false
   */
  abortOnError?: boolean
  /** 分片大小，默认为 4MB */
  chunkSize: number
  /** 每一个分片计算完成后的回调函数，参数为计算结果 */
  onChunkHashed?: (result: ChunkHashResult[]) => void
}

/**
 * 分割大文件，计算每个分片的 MD5 值，使用 Web Worker 并行计算。
 * 每个 worker 都会加载 calculateMD5 函数，函数依赖了 hash-wasm 库，所以网络不好的情况下可能会比在渲染主线程直接处理更慢。
 * @param createWorker 可以使用 pnpm helpers [options] [targetDir="src/worker"] 创建一个 worker 实现
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
export async function calculateChunksMD5WithWorkers(
  file: Blob,
  createWorker: () => Worker,
  options: ChunkWorkerOptions = { chunkSize: defaultChunkSize, maxRetries: 0, abortOnError: false },
) {
  const { chunkSize, onChunkHashed, maxRetries, abortOnError } = options
  const concurrency = navigator.hardwareConcurrency || 4
  const chunkCount = Math.ceil(file.size / chunkSize)
  const results: ChunkHashResult[] = Array.from({ length: chunkCount })
  // 创建固定数量的 worker
  const workers: Worker[] = Array.from({ length: concurrency }, () => createWorker())

  // 创建 AbortController 用于在发生错误时协调所有 worker 的终止操作
  const abortController = new AbortController()

  const processWorkerChunk = (
    worker: Worker,
    workerIndex: number,
    retriesLeft: number,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 计算当前 worker 需要处理的文件块范围
      const startChunkIndex = workerIndex * Math.ceil(chunkCount / concurrency)
      const endChunkIndex = Math.min(startChunkIndex + Math.ceil(chunkCount / concurrency), chunkCount)

      // 声明清理函数，用于移除事件监听器
      let cleanup: () => void

      // 处理 worker 成功完成计算的情况
      const messageHandler = (event: MessageEvent) => {
        const workerResults = event.data
        onChunkHashed?.(workerResults)
        // 将计算结果存入对应位置
        for (const workerResult of workerResults) {
          results[workerResult.index] = workerResult
        }
        cleanup()
        resolve()
      }

      // 处理 worker 错误的情况
      const errorHandler = async (error: ErrorEvent) => {
        if (retriesLeft > 0) {
          console.warn(`Worker ${workerIndex} failed, retrying... (${retriesLeft} attempts left)`)
          cleanup()
          try {
            // 重试：重新发送相同的任务给 worker
            worker.postMessage({
              file,
              startChunkIndex,
              endChunkIndex,
              chunkSize,
            } as ChunkWorkerMessage)
            await processWorkerChunk(worker, workerIndex, retriesLeft - 1)
            resolve()
          }
          catch (retryError) {
            reject(retryError)
          }
        }
        else {
          // 重试次数用完，构造最终错误信息
          const finalError = new Error(
            `Worker ${workerIndex} failed after ${maxRetries} retries. Last error: ${error.message}`,
          )

          // 如果配置了错误时中止所有任务，则触发中止信号
          if (abortOnError) {
            abortController.abort(finalError)
          }
          cleanup()
          reject(finalError)
        }
      }

      // 定义清理函数的具体实现
      cleanup = () => {
        worker.removeEventListener('message', messageHandler)
        worker.removeEventListener('error', errorHandler)
      }

      // 监听中止信号，当收到中止信号时清理资源并拒绝 promise
      abortController.signal.addEventListener('abort', () => {
        cleanup()
        worker.terminate()
        reject(abortController.signal.reason)
      })

      // 为 worker 添加事件监听器
      worker.addEventListener('message', messageHandler)
      worker.addEventListener('error', errorHandler)

      // 向 worker 发送任务
      worker.postMessage({
        file,
        startChunkIndex,
        endChunkIndex,
        chunkSize,
      } as ChunkWorkerMessage)
    })
  }

  try {
    // 并行处理所有 worker 的任务
    const workerPromises = workers.map((worker, index) =>
      processWorkerChunk(worker, index, maxRetries || 0),
    )

    await Promise.all(workerPromises)
    return results
  }
  finally {
    // 确保在完成或发生错误时清理所有 worker 资源
    workers.forEach(worker => worker.terminate())
  }
}

/**
 * 分割大文件，计算每个分片的 MD5 值，使用 SharedWorker 并行计算。
 * @param file 文件对象
 * @param chunkSize 分片大小，默认为 4MB
 * @param onChunkHashed 每一个分片计算完成后的回调函数，参数为计算结果
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
// export async function largeFileChunkHashWithSharedWorker(
//   file: Blob,
//   chunkSize = defaultChunkSize,
//   onChunkHashed?: (result: ChunkHashResult) => void,
// ) {
//   const chunkCount = Math.ceil(file.size / chunkSize)
//   const results: ChunkHashResult[] = Array.from({ length: chunkCount })

//   const worker = new SharedWorker(new URL('./worker/hashSharedWorker.ts', import.meta.url), { type: 'module' })

//   return new Promise<ChunkHashResult[]>((resolve, reject) => {
//     let completedChunks = 0

//     worker.port.onmessage = (event) => {
//       const workerResult = event.data
//       results[workerResult.index] = workerResult

//       onChunkHashed?.(workerResult)

//       completedChunks++
//       if (completedChunks === chunkCount) {
//         worker.port.close() // 完成后关闭 port
//         resolve(results)
//       }
//     }

//     // 将每个分片发送给 Worker
//     const processChunks = async () => {
//       for (let i = 0; i < chunkCount; i++) {
//         const { chunkStart, chunkEnd } = getChunkBounds(i, chunkSize, file.size)
//         const blob = file.slice(chunkStart, chunkEnd)
//         worker.port.postMessage({ chunkStart, chunkEnd, blob, index: i })
//       }
//     }

//     processChunks().catch(reject)
//   })
// }
