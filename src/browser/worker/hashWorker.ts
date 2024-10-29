import type { HashResult, WorkerMessage } from '../upload'
import { hashWASMMD5 } from '../hash'

onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { file, startChunkIndex, endChunkIndex, chunkSize } = event.data
  const results: HashResult[] = []
  for (let i = startChunkIndex; i < endChunkIndex; i++) {
    const chunkStart = i * chunkSize
    const chunkEnd = Math.min(chunkStart + chunkSize, file.size)
    const blob = file.slice(chunkStart, chunkEnd)
    const arrayBuffer = await blob.arrayBuffer()
    const hash = await hashWASMMD5(arrayBuffer)
    results.push({
      index: i,
      chunkStart,
      chunkEnd,
      hash,
      blob,
    })
  }
  // const results = await Promise.all<HashResult>(
  //   Array.from({ length: endChunkIndex - startChunkIndex }, async (_, index) => {
  //     const chunkIndex = startChunkIndex + index // 计算每个分片的索引
  //     const chunkStart = chunkIndex * chunkSize
  //     const chunkEnd = Math.min(chunkStart + chunkSize, file.size)
  //     const blob = file.slice(chunkStart, chunkEnd)

  //     const arrayBuffer = await blob.arrayBuffer()
  //     const hash = await hashWASMMD5(arrayBuffer)

  //     return {
  //       index: chunkIndex,
  //       chunkStart,
  //       chunkEnd,
  //       hash,
  //       blob,
  //     }
  //   }),
  // )
  postMessage(results)
}
