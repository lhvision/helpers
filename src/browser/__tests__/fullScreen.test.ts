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

describe('fullscreen API', () => {
  let element: HTMLElement

  // 模拟全屏状态
  let isFullscreen = false

  // 模拟全屏元素
  let fullscreenElement: HTMLElement | null = null

  // 模拟全屏变化事件的监听器
  const listeners: { [key: string]: (() => void)[] } = {}

  beforeEach(() => {
    // 创建一个测试元素
    element = document.createElement('div')
    document.body.appendChild(element)

    // 重置全屏状态
    isFullscreen = false
    fullscreenElement = null

    // 清空事件监听器
    for (const key in listeners) {
      listeners[key] = []
    }

    // 模拟 HTMLElement 的 requestFullscreen 方法
    element.requestFullscreen = vi.fn().mockImplementation(() => {
      if (!isFullscreen) {
        isFullscreen = true
        fullscreenElement = element
        // 触发 fullscreenchange 事件
        listeners.fullscreenchange?.forEach(callback => callback())
      }
      return Promise.resolve()
    })

    // 模拟 Document 的 exitFullscreen 方法
    document.exitFullscreen = vi.fn().mockImplementation(() => {
      if (isFullscreen) {
        isFullscreen = false
        fullscreenElement = null
        // 触发 fullscreenchange 事件
        listeners.fullscreenchange?.forEach(callback => callback())
      }
      return Promise.resolve()
    })

    // 模拟文档的 fullscreenElement 属性
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => fullscreenElement,
      configurable: true,
    })

    // 模拟 addEventListener
    document.addEventListener = vi.fn().mockImplementation((event, callback) => {
      if (!listeners[event]) {
        listeners[event] = []
      }
      listeners[event].push(callback as () => void)
    })

    // 模拟 removeEventListener
    document.removeEventListener = vi.fn().mockImplementation((event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback)
      }
    })
  })

  afterEach(() => {
    // 清理 DOM
    document.body.removeChild(element)
    // 清除所有模拟
    vi.resetAllMocks()
    // 重置事件监听器
    for (const key in listeners) {
      listeners[key] = []
    }
  })

  it('should enter fullscreen', async () => {
    await requestFullScreen(element)
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(true)
    expect(isFullScreen()).toBe(true)
    expect(getFullScreenElement()).toBe(element)
  })

  it('should exit fullscreen', async () => {
    await requestFullScreen(element)
    expect(isFullscreen).toBe(true)
    await exitFullScreen()
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(false)
    expect(isFullScreen()).toBe(false)
    expect(getFullScreenElement()).toBe(null)
  })

  it('should toggle fullscreen', async () => {
    await toggleFullScreen(element)
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(true)
    expect(isFullScreen()).toBe(true)
    expect(getFullScreenElement()).toBe(element)

    await toggleFullScreen(element)
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(false)
    expect(isFullScreen()).toBe(false)
    expect(getFullScreenElement()).toBe(null)
  })

  it('should listen to fullscreen change', async () => {
    const handleFullScreenChange = vi.fn(() => {
      expect(isFullScreen()).toBe(true)
      offFullScreenChange(handleFullScreenChange)
    })

    onFullScreenChange(handleFullScreenChange)
    await requestFullScreen(element)

    expect(handleFullScreenChange).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple fullscreen change listeners', async () => {
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

  it('should not fail if Fullscreen API is not supported', async () => {
    // 移除 requestFullscreen 方法
    element.requestFullscreen = undefined as any

    await expect(requestFullScreen(element)).rejects.toThrow(
      'Fullscreen API is not supported',
    )
  })

  it('should correctly get the current fullscreen element', async () => {
    expect(getFullScreenElement()).toBe(null)
    await requestFullScreen(element)
    expect(getFullScreenElement()).toBe(element)
    await exitFullScreen()
    expect(getFullScreenElement()).toBe(null)
  })

  it('should handle exitFullScreen when not in fullscreen', async () => {
    await exitFullScreen()
    expect(document.exitFullscreen).not.toHaveBeenCalled()
    expect(isFullscreen).toBe(false)
    expect(isFullScreen()).toBe(false)
    expect(getFullScreenElement()).toBe(null)
  })

  it('should handle requestFullScreen when already in fullscreen', async () => {
    await requestFullScreen(element)
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    await requestFullScreen(element)
    // 根据实现，应该不会再次调用 requestFullscreen
    expect(element.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(isFullscreen).toBe(true)
    expect(isFullScreen()).toBe(true)
    expect(getFullScreenElement()).toBe(element)
  })
})
