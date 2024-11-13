import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFileHashStream, hashStreamToUploadStream, uploadFileInChunks } from '../upload'

describe('文件上传测试', () => {
  // 模拟文件数据
  let testFile: File
  const mockFileContent = 'test file content'

  beforeEach(() => {
    testFile = new File([mockFileContent], 'test.txt', { type: 'text/plain' })
  })

  // 新增一个通用取消流的函数
  async function cancelStream(reader: ReadableStreamDefaultReader<any>, stream?: ReadableStream<any>) {
    reader.releaseLock()
    // await reader.cancel()
    if (stream)
      await stream.cancel()
  }

  describe('createFileHashStream', () => {
    it('应该正确创建哈希流', async () => {
      const onHashProgress = vi.fn()
      const stream = createFileHashStream(testFile, {
        chunkSize: 5,
        onHashProgress,
      })

      const reader = stream.getReader()
      const chunks: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        chunks.push(value)
      }
      await cancelStream(reader, stream)

      expect(chunks.length).toBeGreaterThan(0)
      expect(onHashProgress).toHaveBeenCalled()
      expect(chunks[0]).toHaveProperty('hash')
      expect(chunks[0]).toHaveProperty('index')
    })

    it('应该跳过已上传的分片', async () => {
      const uploadedChunks = [{
        hash: 'mock-hash',
        index: 0,
      }]

      const stream = createFileHashStream(testFile, {
        chunkSize: 5,
        uploadedChunks,
      })

      const reader = stream.getReader()
      const chunks: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        chunks.push(value)
      }

      await cancelStream(reader, stream)

      expect(chunks.every(chunk => chunk.hash !== 'mock-hash')).toBe(true)
    })
  })

  describe('hashStreamToUploadStream', () => {
    it('应该正确处理并发上传', async () => {
      const mockUploadChunk = vi.fn().mockResolvedValue({ success: true })

      // 创建一个简单的可读流
      const chunks = [
        { hash: 'hash1', index: 0, blob: new Blob(['chunk1']), chunkStart: 0, chunkEnd: 5 },
        { hash: 'hash2', index: 1, blob: new Blob(['chunk2']), chunkStart: 5, chunkEnd: 10 },
      ]

      const inputStream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk)
          }
          controller.close()
        },
      })

      // 使用 hashStreamToUploadStream 处理流
      const { readable, writable } = hashStreamToUploadStream(mockUploadChunk, 'mock-file-hash', {
        concurrency: 2,
        retries: 1,
      })

      // 将输入流通过管道传输到转换流
      inputStream.pipeTo(writable).catch(() => {})

      // 收集结果
      const results: any[] = []
      const reader = readable.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break
          results.push(value)
        }
      }
      finally {
        await cancelStream(reader, readable)
      }

      expect(results.length).toBe(2)
      expect(mockUploadChunk).toHaveBeenCalledTimes(2)
      expect(results.every(r => r.uploaded)).toBe(true)
    })

    it('应该处理上传失败和重试', async () => {
      let attempts = 0
      const mockUploadChunk = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts === 1)
          return Promise.reject(new Error('Upload failed'))
        return Promise.resolve({ success: true })
      })

      const inputStream = new ReadableStream({
        start(controller) {
          controller.enqueue({
            hash: 'hash1',
            index: 0,
            blob: new Blob(['chunk1']),
            chunkStart: 0,
            chunkEnd: 5,
          })
          controller.close()
        },
      })

      const { readable, writable } = hashStreamToUploadStream(mockUploadChunk, 'mock-file-hash', {
        concurrency: 1,
        retries: 1,
      })

      // 将输入流通过管道传输到转换流
      inputStream.pipeTo(writable).catch(() => {})

      // 收集结果
      const results: any[] = []
      const reader = readable.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break
          results.push(value)
        }
      }
      finally {
        await cancelStream(reader, readable)
      }

      expect(mockUploadChunk).toHaveBeenCalledTimes(2)
      expect(results[0].uploaded).toBe(true)
    })
  })

  describe('uploadFileInChunks', () => {
    it('应该完成完整的文件上传流程', async () => {
      const mockHandlers = {
        uploadChunk: vi.fn().mockResolvedValue({ success: true }),
        mergeChunks: vi.fn().mockResolvedValue({ success: true }),
      }

      const onHashProgress = vi.fn()
      const onUploadProgress = vi.fn()

      const result = await uploadFileInChunks(testFile, mockHandlers, {
        chunkSize: 5,
        onHashProgress,
        onUploadProgress,
        concurrency: 2,
      })

      expect(result).toHaveProperty('uploadedChunks')
      expect(result).toHaveProperty('mergeResult')
      expect(onHashProgress).toHaveBeenCalled()
      expect(onUploadProgress).toHaveBeenCalled()
      expect(mockHandlers.uploadChunk).toHaveBeenCalled()
      expect(mockHandlers.mergeChunks).toHaveBeenCalled()
    })

    it('应该正确处理上传错误', async () => {
      const mockHandlers = {
        uploadChunk: vi.fn().mockRejectedValue(new Error('Upload failed')),
        mergeChunks: vi.fn(),
      }

      await expect(uploadFileInChunks(testFile, mockHandlers, {
        chunkSize: 5,
        exitOnError: true,
      })).rejects.toThrow('Failed to process file: Error')
    })

    it('应该正确清理资源', async () => {
      const mockHandlers = {
        uploadChunk: vi.fn().mockResolvedValue({ success: true }),
        mergeChunks: vi.fn().mockResolvedValue({ success: true }),
      }

      const consoleSpy = vi.spyOn(console, 'warn')

      await uploadFileInChunks(testFile, mockHandlers)

      // 验证资源是否被正确清理
      expect(consoleSpy).not.toHaveBeenCalledWith('取消读取器失败:')
      expect(consoleSpy).not.toHaveBeenCalledWith('取消哈希流失败:')
    })

    it('应该支持断点续传', async () => {
      const uploadedChunks = [{
        hash: 'existing-hash',
        index: 0,
      }]

      const mockHandlers = {
        getUploadedChunks: vi.fn().mockResolvedValue(uploadedChunks),
        uploadChunk: vi.fn().mockResolvedValue({ success: true }),
        mergeChunks: vi.fn().mockResolvedValue({ success: true }),
      }

      const result = await uploadFileInChunks(testFile, mockHandlers)

      expect(result.oldUploadedChunks).toEqual(uploadedChunks)
      // 验证只上传了新的分片
      expect(mockHandlers.uploadChunk).not.toHaveBeenCalledWith(
        expect.objectContaining({ hash: 'existing-hash' }),
      )
    })
  })
})
