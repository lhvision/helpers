// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  exitFullScreen,
  getFullScreenElement,
  isFullScreen,
  offFullScreenChange,
  onFullScreenChange,
  requestFullScreen,
  toggleFullScreen,
} from '../fullScreen'

describe('全屏 API', () => {
  let element: HTMLElement
  let isFullscreen = false
  let fullscreenElement: HTMLElement | null = null
  const listeners: { [key: string]: (() => void)[] } = {}

  beforeEach(() => {
    // 创建测试元素
    element = document.createElement('div')
    document.body.appendChild(element)

    // 重置状态
    isFullscreen = false
    fullscreenElement = null

    // 清空事件监听器
    for (const key in listeners) {
      listeners[key] = []
    }

    // 模拟全屏请求方法
    element.requestFullscreen = vi.fn().mockImplementation(() => {
      if (!isFullscreen) {
        isFullscreen = true
        fullscreenElement = element
        listeners.fullscreenchange?.forEach(callback => callback())
      }
      return Promise.resolve()
    })

    // 模拟退出全屏方法
    document.exitFullscreen = vi.fn().mockImplementation(() => {
      if (isFullscreen) {
        isFullscreen = false
        fullscreenElement = null
        listeners.fullscreenchange?.forEach(callback => callback())
      }
      return Promise.resolve()
    })

    // 模拟全屏元素属性
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => fullscreenElement,
      configurable: true,
    })

    // 模拟事件监听器
    document.addEventListener = vi.fn().mockImplementation((event, callback) => {
      if (!listeners[event])
        listeners[event] = []
      listeners[event].push(callback as () => void)
    })

    document.removeEventListener = vi.fn().mockImplementation((event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback)
      }
    })
  })

  afterEach(() => {
    document.body.removeChild(element)
    vi.resetAllMocks()
    for (const key in listeners) {
      listeners[key] = []
    }
  })

  it('应该能够进入全屏模式', async () => {
    await requestFullScreen(element)
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(true)
    expect(isFullScreen()).toBe(true)
    expect(getFullScreenElement()).toBe(element)
  })

  it('应该能够退出全屏模式', async () => {
    await requestFullScreen(element)
    await exitFullScreen()
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(false)
    expect(isFullScreen()).toBe(false)
    expect(getFullScreenElement()).toBe(null)
  })

  it('应该能够切换全屏状态', async () => {
    await toggleFullScreen(element)
    expect(isFullscreen).toBe(true)
    expect(getFullScreenElement()).toBe(element)

    await toggleFullScreen(element)
    expect(isFullscreen).toBe(false)
    expect(getFullScreenElement()).toBe(null)
  })

  it('应该能够监听全屏状态变化', async () => {
    const handleFullScreenChange = vi.fn(() => {
      expect(isFullScreen()).toBe(true)
      offFullScreenChange(handleFullScreenChange)
    })

    onFullScreenChange(handleFullScreenChange)
    await requestFullScreen(element)
    expect(handleFullScreenChange).toHaveBeenCalledTimes(1)
  })

  it('应该能够处理多个全屏变化监听器', async () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    onFullScreenChange(callback1)
    onFullScreenChange(callback2)

    await requestFullScreen(element)
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)

    await exitFullScreen()
    expect(callback1).toHaveBeenCalledTimes(2)
    expect(callback2).toHaveBeenCalledTimes(2)
  })

  // it('当全屏 API 不支持时应该抛出错误', async () => {
  //   element.requestFullscreen = undefined as any
  //   await expect(requestFullScreen(element)).rejects.toThrow(
  //     'element.requestFullscreen is not a function',
  //   )
  // })

  it('应该能够正确获取当前全屏元素', async () => {
    expect(getFullScreenElement()).toBe(null)
    await requestFullScreen(element)
    expect(getFullScreenElement()).toBe(element)
    await exitFullScreen()
    expect(getFullScreenElement()).toBe(null)
  })

  it('在非全屏状态下调用退出全屏不应该有效果', async () => {
    await exitFullScreen()
    expect(document.exitFullscreen).not.toHaveBeenCalled()
    expect(isFullScreen()).toBe(false)
  })

  it('在全屏状态下重复请求全屏不应该重复调用 API', async () => {
    await requestFullScreen(element)
    await requestFullScreen(element)
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullScreen()).toBe(true)
  })
})
