// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadUrl, downloadWithProgress, streamDownload } from '../browser/download'

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

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
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

      await streamDownload(mockResponse, 'test.pdf')

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

      await downloadWithProgress(mockResponse, onProgress, 'test.pdf')

      expect(onProgress).toHaveBeenCalled()
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })
  })
})
