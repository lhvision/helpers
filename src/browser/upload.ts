import { hashWASMMD5 } from './hash'
import HashSharedWorker from './worker/hashSharedWorker?sharedworker&inline'
import HashWorker from './worker/hashWorker?worker&inline'

export interface WorkerMessage {
  file: Blob
  startChunkIndex: number
  endChunkIndex: number
  chunkSize: number
}

export interface SharedWorkerMessage {
  index: number
  chunkStart: number
  chunkEnd: number
  blob: Blob
}

export interface HashResult {
  index: number
  chunkStart: number
  chunkEnd: number
  hash: string
  blob: Blob
}

const defaultChunkSize = 4 * 1024 * 1024

function getChunkBounds(i: number, chunkSize: number, fileSize: number) {
  const chunkStart = i * chunkSize
  const chunkEnd = Math.min(chunkStart + chunkSize, fileSize)
  return { chunkStart, chunkEnd }
}

/**
 * 分割大文件，计算每个分片的 MD5 值，使用 WebAssembly 实现。
 * @param file 文件对象
 * @param chunkSize 分片大小，默认为 4MB
 * @param onChunkHashed 每一个分片计算完成后的回调函数，参数为计算结果
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
export async function largeFileHashList(
  file: Blob,
  chunkSize = defaultChunkSize,
  onChunkHashed?: (result: HashResult) => void,
) {
  const chunkCount = Math.ceil(file.size / chunkSize)
  const results: HashResult[] = Array.from({ length: chunkCount })

  for (let i = 0; i < chunkCount; i++) {
    const { chunkStart, chunkEnd } = getChunkBounds(i, chunkSize, file.size)
    const blob = file.slice(chunkStart, chunkEnd)
    const arrayBuffer = await blob.arrayBuffer()
    const hash = await hashWASMMD5(arrayBuffer)
    const result = { index: i, chunkStart, chunkEnd, hash, blob }
    onChunkHashed?.(result)
    results[i] = result
  }

  return results
}

/**
 * 分割大文件，计算每个分片的 MD5 值，使用 Web Worker 并行计算。
 * @param file 文件对象
 * @param chunkSize 分片大小，默认为 4MB
 * @param onChunkHashed 每一个分片计算完成后的回调函数，参数为计算结果
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
export async function largeFileHashWithWorkers(
  file: Blob,
  chunkSize = defaultChunkSize,
  onChunkHashed?: (result: HashResult[]) => void,
) {
  const concurrency = navigator.hardwareConcurrency || 4
  const chunkCount = Math.ceil(file.size / chunkSize)
  const results: HashResult[] = Array.from({ length: chunkCount })

  const workers: Worker[] = Array.from({ length: concurrency }, () => new HashWorker())
  // new Worker(new URL('./worker/hashWorker.ts', import.meta.url), { type: 'module' }))

  const workerPromises: Promise<void>[] = workers.map((worker, workerIndex) => {
    return new Promise<void>((resolve, reject) => {
      const startChunkIndex = workerIndex * Math.ceil(chunkCount / concurrency)
      const endChunkIndex = Math.min(startChunkIndex + Math.ceil(chunkCount / concurrency), chunkCount)

      worker.onmessage = (event) => {
        const workerResults = event.data
        onChunkHashed?.(workerResults)
        for (const workerResult of workerResults) {
          results[workerResult.index] = workerResult
        }
        resolve()
      }

      worker.onerror = (error) => {
        console.error(`Worker error: ${error.message}`)
        reject(error) // Reject the promise on worker error
      }

      worker.postMessage({
        file,
        startChunkIndex,
        endChunkIndex,
        chunkSize,
      } as WorkerMessage)
    })
  })

  await Promise.all(workerPromises)
  return results
}
// return new Promise((resolve) => {
//   const chunkCount = Math.ceil(file.size / chunkSize)
//   // 为每个 Worker 分配任务
//   const chunkPerWorker = Math.ceil(chunkCount / concurrency)
//   let finishCount = 0
//   const results: ResultType[] = []

//   for (let i = 0; i < concurrency; i++) {
//     // 计算每个 Worker 处理的起始和结束索引
//     const start = i * chunkPerWorker
//     const end = Math.min(start + chunkPerWorker, chunkCount)
//     // 创建 worker, 分配任务
//     const worker = new Worker(new URL('./worker/hashWorker.js', import.meta.url), { type: 'module' })

//     worker.onmessage = (e) => {
//       for (let i = start; i < end; i++) {
//         results[i] = e.data[i - start]
//       }
//       worker.terminate()
//       finishCount++
//       if (finishCount === concurrency) {
//         return resolve(results)
//       }
//     }

//     worker.postMessage({ file, start, end, chunkSize })
//   }
// })

/**
 * 分割大文件，计算每个分片的 MD5 值，使用 SharedWorker 并行计算。
 * @param file 文件对象
 * @param chunkSize 分片大小，默认为 4MB
 * @param onChunkHashed 每一个分片计算完成后的回调函数，参数为计算结果
 * @returns Promise，包含每个分片的 MD5 值和原始 Blob 对象
 */
export async function largeFileHashWithSharedWorker(
  file: Blob,
  chunkSize = defaultChunkSize,
  onChunkHashed?: (result: HashResult) => void,
) {
  const chunkCount = Math.ceil(file.size / chunkSize)
  const results: HashResult[] = Array.from({ length: chunkCount })

  // const worker = new SharedWorker(new URL('./worker/hashSharedWorker.ts', import.meta.url), { type: 'module' })
  const worker = new HashSharedWorker()

  return new Promise<HashResult[]>((resolve, reject) => {
    let completedChunks = 0

    worker.port.onmessage = (event) => {
      const workerResult = event.data
      results[workerResult.index] = workerResult

      onChunkHashed?.(workerResult)

      completedChunks++
      if (completedChunks === chunkCount) {
        worker.port.close() // 完成后关闭 port
        resolve(results)
      }
    }

    // 将每个分片发送给 Worker
    const processChunks = async () => {
      for (let i = 0; i < chunkCount; i++) {
        const { chunkStart, chunkEnd } = getChunkBounds(i, chunkSize, file.size)
        const blob = file.slice(chunkStart, chunkEnd)
        worker.port.postMessage({ chunkStart, chunkEnd, blob, index: i })
      }
    }

    processChunks().catch(reject)
  })
}
