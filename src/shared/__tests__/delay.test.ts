import { beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, throttle } from '../delay'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('应该在延迟后只调用一次函数', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)

    // 连续调用多次
    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(fn).not.toBeCalled()

    // 快进 1000ms
    vi.advanceTimersByTime(1000)
    expect(fn).toBeCalledTimes(1)
  })

  it('immediate 选项应该立即执行函数', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000, { immediate: true })

    debouncedFn()
    expect(fn).toBeCalledTimes(1)

    // 连续调用不会触发
    debouncedFn()
    debouncedFn()
    expect(fn).toBeCalledTimes(1)
  })

  it('cancel 方法应该能取消延迟的函数调用', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)

    debouncedFn()
    debouncedFn.cancel()

    vi.advanceTimersByTime(1000)
    expect(fn).not.toBeCalled()
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('应该在指定时间内最多执行一次', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)

    // 连续调用多次
    throttledFn()
    throttledFn()
    throttledFn()

    expect(fn).toBeCalledTimes(0)

    // 快进 1000ms
    vi.advanceTimersByTime(1000)
    expect(fn).toBeCalledTimes(1) // trailing 调用
  })

  it('leading 为 false 时应该延迟第一次调用', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000, { leading: false })

    throttledFn()
    expect(fn).not.toBeCalled()

    vi.advanceTimersByTime(1000)
    expect(fn).toBeCalledTimes(1)
  })

  it('trailing 为 false 时不应该在结束时调用', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000, { trailing: false })

    throttledFn()
    throttledFn()
    expect(fn).toBeCalledTimes(0)

    vi.advanceTimersByTime(1000)
    expect(fn).toBeCalledTimes(0) // 不会有 trailing 调用
  })
})
