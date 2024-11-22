/** 事件处理器 */
interface EventHandlerItem {
  handler: (...args: any[]) => void
  priority: number
}

class EventBus {
  /** 事件存储 */
  private events: Map<string, EventHandlerItem[]>

  constructor() {
    this.events = new Map()
  }

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 处理函数
   * @param priority 优先级(可选)，数字越大优先级越高，默认为 0
   */
  on(eventName: string, handler: (...args: any[]) => void, priority = 0) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }

    const handlers = this.events.get(eventName)!
    const handlerItem: EventHandlerItem = { handler, priority }

    // 按优先级插入到正确的位置
    const insertIndex = handlers.findIndex(item => item.priority < priority)
    if (insertIndex === -1) {
      handlers.push(handlerItem)
    }
    else {
      handlers.splice(insertIndex, 0, handlerItem)
    }
  }

  /**
   * 取消订阅
   * @param eventName 事件名称
   * @param handler 可选的处理函数，如果不传则取消该事件的所有订阅
   */
  off(eventName: string, handler?: (...args: any[]) => void) {
    if (!handler) {
      // 如果没有传入具体的处理函数，直接删除整个事件
      this.events.delete(eventName)
      return
    }

    const handlers = this.events.get(eventName)
    if (handlers) {
      const index = handlers.findIndex(item => item.handler === handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
      // 如果该事件没有处理函数了，删除这个事件
      if (handlers.length === 0) {
        this.events.delete(eventName)
      }
    }
  }

  /**
   * 取消所有订阅
   * @param eventName 可选的事件名称，如果不传则清空所有事件
   */
  offAll(eventName?: string) {
    if (eventName) {
      this.events.delete(eventName)
    }
    else {
      this.events.clear()
    }
  }

  /** 触发事件 */
  emit(eventName: string, ...args: any[]) {
    const handlers = this.events.get(eventName)
    if (handlers) {
      // 已经按优先级排序，直接执行
      handlers.forEach(item => item.handler(...args))
    }
  }

  /** 获取指定事件的所有处理函数 */
  getHandlers(eventName: string): EventHandlerItem[] {
    return this.events.get(eventName) || []
  }
}

/** 事件总线 - 使用单例模式 */
export const eventBus = new EventBus()
