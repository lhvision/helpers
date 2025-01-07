// type FullscreenMethod = () => void | Promise<void>

/**
 * 处理可能返回 Promise 的全屏方法
 * @param method - 全屏方法
 * @param context - 方法的调用上下文
 * @returns Promise<void>
 */
// function handleFullScreenMethod(method: FullscreenMethod, context: any): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const returnValue = method.call(context)
//     if (returnValue instanceof Promise) {
//       returnValue.then(resolve).catch(reject)
//     }
//     else {
//       resolve()
//     }
//   })
// }

/**
 * 请求全屏
 * @param element - 需要全屏的元素
 */
export function requestFullScreen(element: HTMLElement, options?: FullscreenOptions): Promise<void> {
  if (isFullScreen()) {
    return Promise.resolve()
  }
  return element.requestFullscreen(options)
}

/**
 * 退出全屏
 */
export function exitFullScreen(): Promise<void> {
  if (!isFullScreen()) {
    return Promise.resolve()
  }
  return document.exitFullscreen()
}

/**
 * 获取当前处于全屏的元素
 */
export function getFullScreenElement(): Element | null {
  return document.fullscreenElement
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
export async function toggleFullScreen(element: HTMLElement, options?: FullscreenOptions): Promise<void> {
  if (isFullScreen()) {
    await exitFullScreen()
  }
  else {
    await requestFullScreen(element, options)
  }
}

/**
 * 监听全屏变化
 * @param callback - 全屏状态变化时的回调函数
 */
export function onFullScreenChange(callback: () => void): void {
  document.addEventListener('fullscreenchange', callback)
}

/**
 * 移除全屏变化监听
 * @param callback - 需要移除的回调函数
 */
export function offFullScreenChange(callback: () => void): void {
  document.removeEventListener('fullscreenchange', callback)
}
