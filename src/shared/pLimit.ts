class Queue {
  private concurrencyLimit: number
  private running = 0
  private retries = 0
  private queue: (() => Promise<void>)[] = []
  private exitOnError: boolean
  private isAborting = false

  constructor(concurrencyLimit: number, retries: number, exitOnError: boolean) {
    this.concurrencyLimit = concurrencyLimit
    this.retries = retries
    this.exitOnError = exitOnError
  }

  /**
   * 开始执行下一个任务，如果队列中有任务并且未达到并发限制
   */
  private startNext(): void {
    // 检查队列是否有任务且当前运行的任务数是否小于并发限制
    if (this.queue.length > 0 && this.running < this.concurrencyLimit) {
      // 从队列中取出一个任务
      const task = this.queue.shift()
      if (task) {
        // 增加正在运行的任务数
        this.running++
        task().finally(() => {
          // 任务完成后减少正在运行的任务数
          this.running--
          // 尝试开始下一个任务
          this.startNext()
        })
      }
    }
  }

  /**
   * 添加一个任务到队列中
   * @param fn 要添加的任务函数，返回一个Promise
   * @returns 返回一个Promise，表示任务完成时的结果
   */
  public add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const retryTask = async (remainingRetries: number) => {
        if (this.isAborting) {
          return reject(new Error('Queue execution aborted'))
        }
        try {
          const result = await fn()
          resolve(result)
        }
        catch (error) {
          if (remainingRetries > 0) {
            retryTask(remainingRetries - 1)
          }
          else {
            if (this.exitOnError) {
              this.isAborting = true
            }
            reject(error)
          }
        }
      }

      const task = async () => retryTask(this.retries)

      // 如果当前运行的任务数小于并发限制，则立即尝试开始任务
      if (this.running < this.concurrencyLimit) {
        this.queue.push(task)
        this.startNext()
      }
      else {
        // 否则，将任务添加到队列中，等待执行
        this.queue.push(task)
      }
    })
  }
}

/**
 * 定义一个工厂函数，用于创建具有特定并发限制的 pLimit 实例
 * @param limit 并发限制
 * @param retries 发生错误时重试次数，默认为 0，不重试
 * @param exitOnError 发生错误时是否直接退出队列，默认为 false，不退出
 * @returns 返回一个函数，该函数接收一个任务并将其添加到队列中
 */
export function pLimit(limit: number, retries = 0, exitOnError = false) {
  const queue = new Queue(limit, retries, exitOnError)
  return <T>(task: () => Promise<T>) => queue.add(task)
}
