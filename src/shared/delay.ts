interface Options {
  /**
   * 是否在延迟开始前调用
   */
  leading?: boolean
  /**
   * 是否在延迟结束后调用
   */
  trailing?: boolean
  /**
   * 是否立即执行
   */
  immediate?: boolean
}

// 防抖函数类型定义
interface Debounced<T extends (...args: any[]) => any> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel: () => void
}

/**
 * 防抖函数实现
 * @param fn 需要防抖的函数
 * @param delay 延迟时间，单位毫秒
 * @param options 配置选项
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: Options = {},
): Debounced<T> {
  // if (typeof fn !== 'function')
  //   throw new TypeError('Expected a function')

  // if (typeof delay !== 'number')
  //   throw new TypeError('Expected delay to be a number')

  let timer: NodeJS.Timeout | null = null
  let isInvoked: boolean = false

  // 设置默认选项
  const { immediate = false, leading = false, trailing = true } = options

  // 主函数
  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    // 如果存在定时器则清除
    if (timer)
      clearTimeout(timer)

    // 处理首次调用时的立即执行
    if ((immediate || leading) && !isInvoked) {
      fn.apply(this, args)
      isInvoked = true
    }
    else if (trailing) {
      timer = setTimeout(() => {
        fn.apply(this, args)
        isInvoked = false
      }, delay)
    }
  }

  // 取消功能
  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isInvoked = false
  }

  return debounced
}

// 节流函数类型定义
interface Throttled<T extends (...args: any[]) => any> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel: () => void
}

/**
 * 节流函数实现
 * @param fn 需要节流的函数
 * @param delay 延迟时间，单位毫秒
 * @param options 配置选项
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: Options = {},
): Throttled<T> {
  // if (typeof fn !== 'function')
  //   throw new TypeError('Expected a function')

  // if (typeof delay !== 'number')
  //   throw new TypeError('Expected delay to be a number')

  let timer: NodeJS.Timeout | null = null
  let lastTime: number = 0

  // 设置默认选项
  const { immediate = false, leading = false, trailing = true } = options

  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = performance.now()

    // 处理首次调用
    if (!lastTime && !leading && !immediate)
      lastTime = now

    // 计算剩余时间
    const remaining = delay - (now - lastTime)

    // 立即执行条件：剩余时间<=0 或 首次调用时的立即执行
    if (remaining <= 0 || remaining > delay || (immediate && !lastTime)) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    }
    else if (!timer && trailing) {
      // 设置定时器
      timer = setTimeout(() => {
        lastTime = leading ? performance.now() : 0
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }

  // 取消功能
  throttled.cancel = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastTime = 0
  }

  return throttled
}
