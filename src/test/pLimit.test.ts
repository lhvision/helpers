import { expect, it } from 'vitest'
import { pLimit } from '../pLimit'

// 记录每个任务的开始和结束时间
const taskStartTimes: number[] = []
const taskEndTimes: number[] = []

// 一个模拟任务，记录开始和结束时间
async function mockTask() {
  const startTime = performance.now()
  taskStartTimes.push(startTime)
  await new Promise(resolve => setTimeout(resolve, 1)) // 引入微小延迟，便于观察
  const endTime = performance.now()
  taskEndTimes.push(endTime)
  return 'Test Task'
}

it('pLimit should control concurrency', async () => {
  const concurrencyLimit = 2
  const limit = pLimit(concurrencyLimit)
  const promises = []

  // 添加多个任务
  for (let i = 0; i < 5; i++)
    promises.push(limit(mockTask))

  // 等待所有任务完成
  await Promise.all(promises)

  // 分析并发情况
  let maxConcurrent = 0
  let currentConcurrent = 0
  // 需要根据任务的开始时间来追踪并发情况
  taskStartTimes.sort((a, b) => a - b)

  taskStartTimes.forEach((start, index) => {
    // 数组中的第一个任务，此时没有前一个任务，所以直接增加当前并发数。如果当前任务开始时，前一个任务已经结束，说明这两个任务没有并发执行
    if (index === 0 || start > taskEndTimes[index - 1]) {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
    }
    else {
      currentConcurrent--
    }
  })

  // 验证最大并发数不超过限制
  expect(maxConcurrent).toBeLessThanOrEqual(concurrencyLimit)
})
