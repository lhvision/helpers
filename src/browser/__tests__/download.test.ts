// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadUrl, streamDownload } from '../download'

// 模拟 Headers 类
class MockHeaders {
  private headers = new Map<string, string>()

  append(name: string, value: string) {
    this.headers.set(name, value)
  }

  get(name: string) {
    return this.headers.get(name) || null
  }

  has(name: string) {
    return this.headers.has(name)
  }
}

// 在测试前替换全局 Headers
const originalHeaders = globalThis.Headers
describe('下载函数测试', () => {
  let appendChildSpy: any
  let removeChildSpy: any
  let createElementSpy: any
  let clickSpy: any

  beforeEach(() => {
    // 模拟 DOM API
    clickSpy = vi.fn()
    createElementSpy = vi.fn(() => ({
      click: clickSpy,
    }))
    appendChildSpy = vi.fn()
    removeChildSpy = vi.fn()

    globalThis.document = {
      createElement: createElementSpy,
      body: {
        appendChild: appendChildSpy,
        removeChild: removeChildSpy,
      },
    } as any
    globalThis.Headers = MockHeaders as any
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    globalThis.Headers = originalHeaders
  })

  describe('downloadUrl', () => {
    it('应该创建一个带有正确 URL 的链接并点击', () => {
      const url = 'https://example.com/file.pdf'
      const filename = 'test.pdf'

      downloadUrl(url, filename)

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('downloadBlob', () => {
    it('应该处理字符串内容', () => {
      const content = 'test content'
      const filename = 'test.txt'

      downloadBlob(content, filename)

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
    })

    it('应该处理 Blob 内容', () => {
      const content = new Blob(['test content'])
      const filename = 'test.txt'

      downloadBlob(content, filename)

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })
  })

  describe('streamDownload', () => {
    it('应该处理流式下载', async () => {
      const mockResponse = new Response(new Blob(['test content']), {
        status: 200,
        statusText: 'OK',
      })

      await streamDownload(mockResponse, { filename: 'test.pdf' })

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })

    it('应该处理下载错误', async () => {
      const mockResponse = new Response(null, {
        status: 404,
        statusText: 'Not Found',
      })

      await expect(streamDownload(mockResponse)).rejects.toThrow('HTTP error')
    })
  })

  describe('downloadWithProgress', () => {
    it('应该报告下载进度', async () => {
      const onProgress = vi.fn()
      const contentLength = 100
      const mockResponse = new Response(new Blob(['test content']), {
        status: 200,
        statusText: 'OK',
        headers: { 'content-length': String(contentLength) },
      })

      await streamDownload(mockResponse, { filename: 'test.pdf', onProgress })

      expect(onProgress).toHaveBeenCalled()
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('streamDownload 断点续传测试', () => {
    it('应该支持断点续传', async () => {
      const mockResponse = new Response(new Blob(['test content']), {
        status: 206,
        statusText: 'Partial Content',
        headers: { 'content-length': '12' },
      })

      const onProgress = vi.fn()
      const initialChunks: Uint8Array[] = [new Uint8Array([116, 101, 115, 116])] // 'test'

      const result = await streamDownload(mockResponse, {
        onProgress,
        startByte: 4,
        initialChunks,
      })

      expect(onProgress).toHaveBeenCalled()
      expect(result).toBeUndefined() // 下载完成时返回 undefined

      // 验证已下载的数据块
      const decoder = new TextDecoder()
      const downloadedContent = initialChunks.map(chunk => decoder.decode(chunk)).join('')
      expect(downloadedContent).toBe('test')
    })

    it('应该在下载中断时返回下载状态', async () => {
      const mockResponse = new Response(new Blob(['test content']), {
        status: 206,
        statusText: 'Partial Content',
        headers: { 'content-length': '12' },
      })

      const onProgress = vi.fn()
      const initialChunks: Uint8Array[] = [new Uint8Array([116, 101, 115, 116])] // 'test'

      // 模拟网络错误
      vi.spyOn(mockResponse.body!, 'getReader').mockImplementation(() => ({
        read: async () => {
          throw new Error('Network error')
        },
        releaseLock: () => {},
      } as any))

      const result = await streamDownload(mockResponse, {
        onProgress,
        startByte: 4,
        initialChunks,
      })

      expect(result).toBeDefined()
      expect(result?.loaded).toBe(4) // 初始字节数
      expect(result?.chunks).toEqual(initialChunks)
      expect(result?.headers.get('Range')).toBe('bytes=4-')
    })
  })
})
