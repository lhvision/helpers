#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd, exit } from 'node:process'
import { colorLog } from '@lhvision/helpers/node'

const hashWorkerCode = `import type { HashResult, WorkerMessage } from '@lhvision/helpers/browser';
import { hashWASMMD5 } from '@lhvision/helpers/browser';

// 使用方式 await largeFileHashWithWorkers(selectedFile.value, () => new Worker(new URL('@/worker/hashWorker.ts', import.meta.url), { type: 'module' }));

onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { file, startChunkIndex, endChunkIndex, chunkSize } = event.data;
  const results: HashResult[] = [];
  for (let i = startChunkIndex; i < endChunkIndex; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd = Math.min(chunkStart + chunkSize, file.size);
    const blob = file.slice(chunkStart, chunkEnd);
    const arrayBuffer = await blob.arrayBuffer();
    const hash = await hashWASMMD5(arrayBuffer);
    results.push({
      index: i,
      chunkStart,
      chunkEnd,
      hash,
      blob,
    });
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
  postMessage(results);
};`

async function main() {
  const targetPath = resolve(cwd(), 'src/worker/hashWorker.ts')
  await mkdir(resolve(cwd(), 'src/worker'), { recursive: true })
  // 将 Worker 代码写入到目标文件
  writeFile(targetPath, hashWorkerCode, 'utf-8')
  colorLog('hashWorker.ts created in src/worker directory', 'success')
}

main().catch((error) => {
  colorLog(`Error: ${error.message}`, 'error')
  exit(1)
})
