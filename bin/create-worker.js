#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { colorLog } from '@lhvision/helpers/node'

function showHelp() {
  // eslint-disable-next-line no-console
  console.log(`
Usage: @lhvision/helpers [options] [targetDir]

Options:
  -h, --help       Show help information
  -c, --chunk      Generate chunksMD5Worker
  -s, --stream     Generate calculateStreamMD5Worker
  `)
  exit(0)
}

// 提取参数
const args = argv.slice(2)
let workerType = null
let targetMkdir = 'src/worker' // 默认目标目录

// 检查参数
if (args.includes('-h') || args.includes('--help')) {
  showHelp()
}
else if (args.includes('-c') || args.includes('--chunk')) {
  workerType = 'chunk'
  targetMkdir = args[1] || targetMkdir
}
else if (args.includes('-s') || args.includes('--stream')) {
  workerType = 'stream'
  targetMkdir = args[1] || targetMkdir
}
else {
  colorLog('Error: Please specify either -c/--chunk or -s/--stream to select a worker type', 'error')
  showHelp()
}

const calculateStreamMD5Code = `import { calculateStreamMD5 } from '@lhvision/helpers/upload'

// await calculateMD5WithWorker(selectedFile, () => new Worker(new URL('@/worker/calculateStreamMD5Worker.ts', import.meta.url), { type: 'module' }));

onmessage = async (event: MessageEvent<{
  file: Blob
  chunkSize?: number
}>) => {
  const { file, chunkSize } = event.data
  const hash = await calculateStreamMD5(file, chunkSize)
  postMessage({ hash })
}
`

const chunksMD5WorkerCode = `import type { ChunkHashResult, ChunkWorkerMessage } from '@lhvision/helpers/upload'
import { calculateMD5 } from '@lhvision/helpers/upload'

// await calculateChunksMD5WithWorkers(selectedFile, () => new Worker(new URL('@/worker/chunksMD5Worker.ts', import.meta.url), { type: 'module' }));

onmessage = async (event: MessageEvent<ChunkWorkerMessage>) => {
  const { file, startChunkIndex, endChunkIndex, chunkSize } = event.data
  const results: ChunkHashResult[] = []
  for (let i = startChunkIndex; i < endChunkIndex; i++) {
    const chunkStart = i * chunkSize
    const chunkEnd = Math.min(chunkStart + chunkSize, file.size)
    const blob = file.slice(chunkStart, chunkEnd)
    const arrayBuffer = await blob.arrayBuffer()
    const hash = await calculateMD5(arrayBuffer)
    results.push({
      index: i,
      chunkStart,
      chunkEnd,
      hash,
      blob,
    })
  }
  // const results = await Promise.all<ChunkHashResult>(
  //   Array.from({ length: endChunkIndex - startChunkIndex }, async (_, index) => {
  //     const chunkIndex = startChunkIndex + index // 计算每个分片的索引
  //     const chunkStart = chunkIndex * chunkSize
  //     const chunkEnd = Math.min(chunkStart + chunkSize, file.size)
  //     const blob = file.slice(chunkStart, chunkEnd)

  //     const arrayBuffer = await blob.arrayBuffer()
  //     const hash = await calculateMD5(arrayBuffer)

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
`

async function main() {
  // 根据 workerType 决定文件名和内容
  const fileName = workerType === 'stream' ? 'calculateStreamMD5Worker.ts' : 'chunksMD5Worker.ts'
  const workerCode = workerType === 'stream' ? calculateStreamMD5Code : chunksMD5WorkerCode
  const targetPath = resolve(cwd(), `${targetMkdir}/${fileName}`)

  await mkdir(resolve(cwd(), targetMkdir), { recursive: true })

  // 将选择的 Worker 代码写入到目标文件
  await writeFile(targetPath, workerCode, 'utf-8')
  colorLog(`${fileName} created in ${targetMkdir} directory`, 'success')
}

main().catch((error) => {
  colorLog(`Error: ${error.message}`, 'error')
  exit(1)
})
