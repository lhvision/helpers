import type { SSEOutput } from '../stream'
import { describe, expect, it } from 'vitest'
import { createBinaryStream, createSSEStream, createTextStream } from '../stream'

describe('stream 处理函数', () => {
  describe('createTextStream', () => {
    it('应该正确处理文本流', async () => {
      // 创建模拟数据流
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('hel'))
          controller.enqueue(new TextEncoder().encode('lo'))
          controller.close()
        },
      })

      const receivedChunks: string[] = []

      for await (const chunk of createTextStream(stream)) {
        receivedChunks.push(chunk)
      }

      expect(receivedChunks.join('')).toBe('hello')
    })
  })

  describe('createBinaryStream', () => {
    it('应该正确处理二进制流', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5]),
      ]

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk)
          }
          controller.close()
        },
      })

      const receivedChunks: Uint8Array[] = []

      for await (const chunk of createBinaryStream(stream)) {
        receivedChunks.push(chunk)
      }

      expect(receivedChunks).toEqual(chunks)
    })
  })

  describe('sse 流处理', () => {
    it('应该正确解析 SSE 事件', async () => {
      const events = [
        'event: message\ndata: {"hello": "world"}\n\n',
        'id: 1\ndata: {"foo": "bar"}\n\n',
      ]

      const stream = new ReadableStream({
        async start(controller) {
          for (const event of events) {
            controller.enqueue(new TextEncoder().encode(event))
          }
          controller.close()
        },
      })

      const receivedEvents: SSEOutput[] = []

      for await (const event of createSSEStream(stream)) {
        receivedEvents.push(event)
      }

      expect(receivedEvents).toEqual([
        { event: 'message', data: '{"hello": "world"}' },
        { id: '1', data: '{"foo": "bar"}' },
      ])
    })

    it('应该处理分块接收的 SSE 事件', async () => {
      const chunks = [
        'event: mess',
        'age\ndata: {"he',
        'llo": "world"}\n\n',
      ]

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(new TextEncoder().encode(chunk))
          }
          controller.close()
        },
      })

      const receivedEvents: SSEOutput[] = []

      for await (const event of createSSEStream(stream)) {
        receivedEvents.push(event)
      }

      expect(receivedEvents).toEqual([
        { event: 'message', data: '{"hello": "world"}' },
      ])
    })

    it('应该支持自定义转换流', async () => {
      const input = 'event: message\ndata: {"hello": "world"}\n\n'
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(input))
          controller.close()
        },
      })

      // 自定义转换流 - 将数据转换为大写
      const customTransform = new TransformStream<string, string>({
        transform(chunk, controller) {
          controller.enqueue(chunk.toUpperCase())
        },
      })

      const received: string[] = []
      for await (const chunk of createSSEStream<string>(stream, customTransform)) {
        received.push(chunk)
      }

      expect(received).toEqual([input.toUpperCase()])
    })
  })
})
