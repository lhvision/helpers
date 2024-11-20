import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copyText, readText } from '../clipboard'

describe('clipboard 工具函数', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
  })

  describe('copyText', () => {
    it('成功复制文本', async () => {
      // 模拟 clipboard API
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const text = '要复制的文本'
      const result = await copyText(text)

      expect(result).toBe(true)
      expect(mockWriteText).toHaveBeenCalledWith(text)
      expect(mockWriteText).toHaveBeenCalledTimes(1)
    })

    it('复制失败时返回 false', async () => {
      // 模拟 clipboard API 失败
      const mockWriteText = vi.fn().mockRejectedValue(new Error('复制失败'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const result = await copyText('测试文本')

      expect(result).toBe(false)
      expect(mockWriteText).toHaveBeenCalledTimes(1)
    })
  })

  describe('readText', () => {
    it('成功读取剪贴板文本', async () => {
      const expectedText = '剪贴板中的文本'
      const mockReadText = vi.fn().mockResolvedValue(expectedText)
      Object.defineProperty(navigator, 'clipboard', {
        value: { readText: mockReadText },
        writable: true,
      })

      const result = await readText()

      expect(result).toBe(expectedText)
      expect(mockReadText).toHaveBeenCalledTimes(1)
    })
  })
})
