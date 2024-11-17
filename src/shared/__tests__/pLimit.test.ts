import { beforeEach, describe, expect, it } from 'vitest'
import { pLimit } from '../pLimit'

describe('pLimit', () => {
  // 辅助函数和变量设置
  let taskStartTimes: number[]
  let taskEndTimes: number[]

  beforeEach(() => {
    taskStartTimes = []
    taskEndTimes = []
  })

  async function mockTask(delay = 1) {
    const startTime = performance.now()
    taskStartTimes.push(startTime)
    await new Promise(resolve => setTimeout(resolve, delay))
    const endTime = performance.now()
    taskEndTimes.push(endTime)
    return 'Test Task'
  }

  // 新增：创建一个会失败特定次数后成功的任务
  function createFailingTask(failCount: number) {
    let attempts = 0
    return async () => {
      attempts++
      if (attempts <= failCount)
        throw new Error(`Attempt ${attempts} failed`)
      return 'Success after retries'
    }
  }

  // 原有的并发控制测试
  it('正确控制并发数', async () => {
    const concurrencyLimit = 2
    const limit = pLimit(concurrencyLimit)
    const promises: Promise<string>[] = []

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

  // 原有的错误退出测试
  it('遇到错误时正确退出', async () => {
    const concurrencyLimit = 1
    const limit = pLimit(concurrencyLimit, 0, true) // 不重试，遇到错误时退出
    const promises: Promise<string>[] = []

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

  it('正确执行重试逻辑', async () => {
    const limit = pLimit(1, 2) // 最多重试2次
    const failingTask = createFailingTask(2) // 失败2次后成功

    const result = await limit(failingTask)
    expect(result).toBe('Success after retries')
  })

  it('超出重试次数后失败', async () => {
    const limit = pLimit(1, 1) // 最多重试1次
    const failingTask = createFailingTask(2) // 失败2次后成功

    await expect(limit(failingTask)).rejects.toThrow('Attempt 2 failed')
  })

  it('多个任务重试不影响并发限制', async () => {
    const concurrencyLimit = 2
    const limit = pLimit(concurrencyLimit, 1) // 允许重试1次
    const promises: Promise<string>[] = []

    // 添加会失败一次的任务和正常任务
    for (let i = 0; i < 3; i++) {
      promises.push(limit(createFailingTask(1)))
      promises.push(limit(() => mockTask(10)))
    }

    const results = await Promise.allSettled(promises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    expect(successCount).toBe(6) // 所有任务最终都应该成功
  })

  it('重试时遇到exitOnError应立即停止', async () => {
    const limit = pLimit(1, 2, true) // 允许重试2次，启用exitOnError
    const promises = [
      limit(createFailingTask(3)), // 这个任务会失败
      limit(() => mockTask(10)), // 这个任务应该被取消
    ]

    const results = await Promise.allSettled(promises)

    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('rejected')
    if (results[1].status === 'rejected')
      expect(results[1].reason.message).toBe('Queue execution aborted')
  })
})
