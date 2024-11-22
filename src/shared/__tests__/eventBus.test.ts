import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventBus } from '../request/eventBus'

describe('eventBus', () => {
  beforeEach(() => {
    // 每个测试用例前清空所有事件
    eventBus.offAll()
  })

  it('应该能够订阅和触发事件', () => {
    const handler = vi.fn()
    eventBus.on('test', handler)

    eventBus.emit('test', 'arg1', 'arg2')
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('应该能处理多个订阅者', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    eventBus.on('test', handler1)
    eventBus.on('test', handler2)

    eventBus.emit('test', 'data')

    expect(handler1).toHaveBeenCalledWith('data')
    expect(handler2).toHaveBeenCalledWith('data')
  })

  it('应该按照优先级顺序执行', () => {
    const order: number[] = []

    eventBus.on('test', () => order.push(1), 1)
    eventBus.on('test', () => order.push(2), 2)
    eventBus.on('test', () => order.push(0), 0)

    eventBus.emit('test')

    expect(order).toEqual([2, 1, 0])
  })

  it('应该能取消特定的订阅处理器', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    eventBus.on('test', handler1)
    eventBus.on('test', handler2)

    eventBus.off('test', handler1)
    eventBus.emit('test')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalled()
  })

  it('应该能取消某个事件的所有订阅', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    eventBus.on('test1', handler1)
    eventBus.on('test2', handler2)

    eventBus.off('test1')

    eventBus.emit('test1')
    eventBus.emit('test2')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalled()
  })

  it('应该能取消所有事件的订阅', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    eventBus.on('test1', handler1)
    eventBus.on('test2', handler2)

    eventBus.offAll()

    eventBus.emit('test1')
    eventBus.emit('test2')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('应该能获取指定事件的所有处理器', () => {
    const handler1 = () => {}
    const handler2 = () => {}

    eventBus.on('test', handler1, 1)
    eventBus.on('test', handler2, 2)

    const handlers = eventBus.getHandlers('test')

    expect(handlers).toHaveLength(2)
    expect(handlers[0].handler).toBe(handler2) // 高优先级在前
    expect(handlers[1].handler).toBe(handler1)
  })

  it('应该能正确处理不存在的事件', () => {
    expect(() => {
      eventBus.emit('non-existent')
      eventBus.off('non-existent')
      eventBus.getHandlers('non-existent')
    }).not.toThrow()
  })

  it('应该能处理同一个处理器的不同优先级', () => {
    const handler = vi.fn()
    const order: number[] = []

    eventBus.on('test', () => {
      handler()
      order.push(1)
    }, 1)

    eventBus.on('test', () => {
      handler()
      order.push(2)
    }, 2)

    eventBus.emit('test')

    expect(handler).toHaveBeenCalledTimes(2)
    expect(order).toEqual([2, 1])
  })
})
