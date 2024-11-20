type MessageCallback<T = any> = (data: T) => void

export interface TabCommunicationMessage<T = any> {
  type: string
  data: T
  timestamp: number
}

/** 使用 BroadcastChannel 跨标签页通信 */
export class TabCommunication<T = any> {
  /** 消息通道 */
  private channel: BroadcastChannel
  /** 消息监听器 */
  private listeners: Map<string, Set<MessageCallback<T>>>

  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName)
    this.listeners = new Map()

    this.channel.onmessage = (event: MessageEvent<TabCommunicationMessage<T>>) => {
      const message = event.data
      this.handleMessage(message)
    }
  }

  /**
   * 发送消息到其他标签页
   * @param type 消息类型
   * @param data 消息数据
   */
  public send(type: string, data: T): void {
    const message: TabCommunicationMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
    }
    this.channel.postMessage(message)
  }

  /**
   * 监听特定类型的消息
   * @param type 消息类型
   * @param callback 回调函数
   */
  public on(type: string, callback: MessageCallback<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)?.add(callback)
  }

  /**
   * 移除特定类型的消息监听
   * @param type 消息类型
   * @param callback 回调函数
   */
  public off(type: string, callback: MessageCallback<T>): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 移除所有监听器
   */
  public destroy(): void {
    this.listeners.clear()
    this.channel.close()
  }

  /**
   * 处理接收到的消息
   * @param message 消息
   */
  private handleMessage(message: TabCommunicationMessage<T>): void {
    const callbacks = this.listeners.get(message.type)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.data)
        }
        catch (error) {
          console.error('Error in tab message callback:', error)
        }
      })
    }
  }
}
