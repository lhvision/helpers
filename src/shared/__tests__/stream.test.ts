import { describe, expect, it, vi } from 'vitest'
import { processBinaryStream, processTextStream } from '../stream'

describe('stream 处理函数', () => {
  describe('processTextStream', () => {
    it('应该正确处理文本流', async () => {
      // 模拟数据
      const chunks = [
        new Uint8Array([104, 101, 108]), // "hel"
        new Uint8Array([108, 111]), // "lo"
      ]

      // 模拟 Response
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[1] })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: vi.fn(),
      }

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      const receivedChunks: string[] = []
      const onChunk = vi.fn((chunk: string) => {
        receivedChunks.push(chunk)
      })

      await processTextStream(mockResponse, onChunk)

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(receivedChunks.join('')).toBe('hello')
      expect(mockReader.releaseLock).toHaveBeenCalled()
    })

    it('在没有 ReadableStream 时应该抛出错误', async () => {
      const mockResponse = {
        body: null,
      } as unknown as Response

      await expect(processTextStream(mockResponse, vi.fn()))
        .rejects
        .toThrow('ReadableStream not supported')
    })
  })

  describe('processBinaryStream', () => {
    it('应该正确处理二进制流', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5]),
      ]

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[1] })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: vi.fn(),
      }

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      const receivedChunks: Uint8Array[] = []
      const onChunk = vi.fn((chunk: Uint8Array) => {
        receivedChunks.push(chunk)
      })

      await processBinaryStream(mockResponse, onChunk)

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(receivedChunks).toEqual(chunks)
      expect(mockReader.releaseLock).toHaveBeenCalled()
    })

    it('在流结束时应该释放锁', async () => {
      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true }),
        releaseLock: vi.fn(),
      }

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await processBinaryStream(mockResponse, vi.fn())

      expect(mockReader.releaseLock).toHaveBeenCalled()
    })
  })
})
