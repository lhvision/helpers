// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from 'vitest'
import { calculateMD5, calculateStreamMD5, initHashWASM } from '../hash'

describe('hash Functions', () => {
  beforeAll(async () => {
    await initHashWASM()
  })

  it('should hash a small buffer correctly', async () => {
    const buffer = new TextEncoder().encode('Hello World')
    const hash = await calculateMD5(buffer.buffer)

    // 在这里添加你预期的 hash 值
    const expectedHash = 'b10a8db164e0754105b7a99be72e3fe5'
    expect(hash).toBe(expectedHash)
  })

  it('should compute the hash of a large file correctly', async () => {
    // 创建一个大 Blob 对象进行测试
    const largeBlob = new Blob(['This is a test for large file hashing. '.repeat(10000)], { type: 'text/plain' })
    const hash = await calculateStreamMD5(largeBlob)

    // 检查哈希值是否符合预期
    const expectedHash = 'c2809b86cfe33b6267eeed8114c7bd27'
    expect(hash).toBe(expectedHash)
  })
})
