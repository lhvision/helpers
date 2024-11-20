import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TabCommunication } from '../tabCommunication'

describe('tabCommunication', () => {
  let tabCommunication: TabCommunication

  // 模拟 BroadcastChannel
  class MockBroadcastChannel {
    onmessage: ((event: MessageEvent) => void) | null = null

    constructor(public name: string) {}

    postMessage(message: any) {
      // 模拟消息广播
      if (this.onmessage) {
        const messageEvent = new MessageEvent('message', {
          data: message,
        })
        this.onmessage(messageEvent)
      }
    }

    close() {}
  }

  beforeEach(() => {
    // 替换全局的 BroadcastChannel
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
    tabCommunication = new TabCommunication('test-channel')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('应该正确创建实例', () => {
    expect(tabCommunication).toBeInstanceOf(TabCommunication)
  })

  it('应该能够正确发送和接收消息', () => {
    const mockCallback = vi.fn()
    const messageType = 'TEST_EVENT'
    const messageData = { foo: 'bar' }

    // 监听消息
    tabCommunication.on(messageType, mockCallback)

    // 发送消息
    tabCommunication.send(messageType, messageData)

    // 验证回调被调用
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith(messageData)
  })

  it('应该能够处理同一事件的多个监听器', () => {
    const mockCallback1 = vi.fn()
    const mockCallback2 = vi.fn()
    const messageType = 'TEST_EVENT'
    const messageData = { foo: 'bar' }

    tabCommunication.on(messageType, mockCallback1)
    tabCommunication.on(messageType, mockCallback2)
    tabCommunication.send(messageType, messageData)

    expect(mockCallback1).toHaveBeenCalledTimes(1)
    expect(mockCallback2).toHaveBeenCalledTimes(1)
  })

  it('应该能够正确移除监听器', () => {
    const mockCallback = vi.fn()
    const messageType = 'TEST_EVENT'
    const messageData = { foo: 'bar' }

    tabCommunication.on(messageType, mockCallback)
    tabCommunication.off(messageType, mockCallback)
    tabCommunication.send(messageType, messageData)

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('应该能够正确处理回调中的错误', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const messageType = 'TEST_EVENT'
    const messageData = { foo: 'bar' }

    const errorCallback = () => {
      throw new Error('测试错误')
    }

    tabCommunication.on(messageType, errorCallback)
    tabCommunication.send(messageType, messageData)

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('销毁实例时应该清理所有监听器', () => {
    const mockCallback = vi.fn()
    const messageType = 'TEST_EVENT'
    const messageData = { foo: 'bar' }

    tabCommunication.on(messageType, mockCallback)
    tabCommunication.destroy()
    tabCommunication.send(messageType, messageData)

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('应该能够正确处理泛型类型', () => {
    interface TestMessage {
      id: number
      name: string
    }

    const typedCommunication = new TabCommunication<TestMessage>('typed-channel')
    const mockCallback = vi.fn()
    const messageType = 'TEST_EVENT'
    const messageData: TestMessage = { id: 1, name: '测试' }

    typedCommunication.on(messageType, mockCallback)
    typedCommunication.send(messageType, messageData)

    expect(mockCallback).toHaveBeenCalledWith(messageData)
  })
})
