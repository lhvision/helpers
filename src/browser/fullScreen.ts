type FullscreenMethod = () => void | Promise<void>

/**
 * 处理可能返回 Promise 的全屏方法
 * @param method - 全屏方法
 * @param context - 方法的调用上下文
 * @returns Promise<void>
 */
function handleFullScreenMethod(method: FullscreenMethod, context: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const returnValue = method.call(context)
    if (returnValue instanceof Promise) {
      returnValue.then(resolve).catch(reject)
    }
    else {
      resolve()
    }
  })
}

/**
 * 请求全屏
 * @param element - 需要全屏的元素
 */
export function requestFullScreen(element: HTMLElement): Promise<void> {
  if (isFullScreen()) {
    return Promise.resolve()
  }

  const request = element.requestFullscreen
    || (document as any).webkitRequestFullscreen
    || (document as any).mozRequestFullScreen
    || (document as any).msRequestFullscreen

  if (request) {
    return handleFullScreenMethod(request, element)
  }
  else {
    return Promise.reject(new Error('Fullscreen API is not supported'))
  }
}

/**
 * 退出全屏
 */
export function exitFullScreen(): Promise<void> {
  if (!isFullScreen()) {
    return Promise.resolve()
  }

  const exit = document.exitFullscreen
    || (document as any).webkitExitFullscreen
    || (document as any).mozCancelFullScreen
    || (document as any).msExitFullscreen

  if (exit) {
    return handleFullScreenMethod(exit, document)
  }
  else {
    return Promise.reject(new Error('Fullscreen API is not supported'))
  }
}

/**
 * 获取当前处于全屏的元素
 */
export function getFullScreenElement(): Element | null {
  return document.fullscreenElement
    || (document as any).webkitFullscreenElement
    || (document as any).mozFullScreenElement
    || (document as any).msFullscreenElement
    || null
}

/**
 * 检查当前是否处于全屏状态
 * @returns boolean
 */
export function isFullScreen(): boolean {
  return !!getFullScreenElement()
}

/**
 * 切换全屏
 * @param element - 需要全屏的元素
 */
export async function toggleFullScreen(element: HTMLElement): Promise<void> {
  if (isFullScreen()) {
    await exitFullScreen()
  }
  else {
    await requestFullScreen(element)
  }
}

/**
 * 监听全屏变化
 * @param callback - 全屏状态变化时的回调函数
 */
export function onFullScreenChange(callback: () => void): void {
  document.addEventListener('fullscreenchange', callback)
  document.addEventListener('webkitfullscreenchange', callback)
  document.addEventListener('mozfullscreenchange', callback)
  document.addEventListener('MSFullscreenChange', callback)
}

/**
 * 移除全屏变化监听
 * @param callback - 需要移除的回调函数
 */
export function offFullScreenChange(callback: () => void): void {
  document.removeEventListener('fullscreenchange', callback)
  document.removeEventListener('webkitfullscreenchange', callback)
  document.removeEventListener('mozfullscreenchange', callback)
  document.removeEventListener('MSFullscreenChange', callback)
}
