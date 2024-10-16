import { expect, it } from 'vitest'
import { pLimit } from '../shared/pLimit'

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

it('正确控制并发数', async () => {
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

it('遇到错误时正确退出', async () => {
  const concurrencyLimit = 1
  const limit = pLimit(concurrencyLimit, 0, true) // 不重试，遇到错误时退出
  const promises = []

  // 模拟一个会抛出错误的任务
  const errorTask = async () => {
    throw new Error('Task Error')
  }

  // 模拟一个正常的任务
  const normalTask = async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    return 'Normal Task'
  }

  // 添加任务到队列
  promises.push(limit(normalTask))
  promises.push(limit(errorTask))
  promises.push(limit(normalTask))
  promises.push(limit(normalTask))

  // 捕获并验证错误
  try {
    await Promise.all(promises)
    // 如果没有抛出错误，测试应该失败
    expect.fail('Expected an error to be thrown')
  }
  catch (error: any) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Task Error')
  }

  // 验证后续任务是否被取消
  const results = await Promise.allSettled(promises)

  // 第一个正常任务应该成功完成
  expect(results[0].status).toBe('fulfilled')

  // 错误任务应该被拒绝
  expect(results[1].status).toBe('rejected')

  // 后续任务应该被拒绝，因为队列已经退出
  expect(results[2].status).toBe('rejected')
  expect(results[3].status).toBe('rejected')

  // 验证被拒绝的任务的错误消息
  results.slice(2).forEach((result) => {
    if (result.status === 'rejected') {
      expect(result.reason.message).toBe('Queue execution aborted')
    }
  })
})
