type TaskPriority = 'high' | 'normal' | 'low'

interface Task<T = any> {
  id: string
  fn: () => Promise<T> | T
  priority: TaskPriority
  timeout?: number
  onProgress?: (progress: number) => void
  onComplete?: (result: T) => void
  onError?: (error: any) => void
}

class IdleTaskScheduler {
  private tasks: Map<TaskPriority, Task[]> = new Map()
  private isProcessing: boolean = false
  private maxConcurrent: number
  private timeSlice: number = 5 // 每个任务的时间片(ms)

  constructor(maxConcurrent: number = 3) {
    // 初始化优先级队列
    this.tasks.set('high', [])
    this.tasks.set('normal', [])
    this.tasks.set('low', [])
    this.maxConcurrent = maxConcurrent
  }

  /**
   * 添加任务
   */
  addTask<T>(
    fn: () => Promise<T> | T,
    options: Partial<Omit<Task<T>, 'fn'>> = {},
  ): string {
    const task: Task<T> = {
      id: Math.random().toString(36).slice(2),
      fn,
      priority: options.priority || 'normal',
      timeout: options.timeout,
      onProgress: options.onProgress,
      onComplete: options.onComplete,
      onError: options.onError,
    }

    this.tasks.get(task.priority)?.push(task)

    if (!this.isProcessing) {
      this.process()
    }

    return task.id
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    let canceled = false
    this.tasks.forEach((tasks) => {
      const index = tasks.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.splice(index, 1)
        canceled = true
      }
    })
    return canceled
  }

  /**
   * 取消所有任务
   */
  cancelAll(): void {
    this.tasks.forEach(tasks => tasks.splice(0))
    this.isProcessing = false
  }

  /**
   * 获取待处理任务数量
   */
  getPendingCount(): number {
    return Array.from(this.tasks.values())
      .reduce((sum, tasks) => sum + tasks.length, 0)
  }

  private async process(): Promise<void> {
    this.isProcessing = true

    const processTask = async (deadline: IdleDeadline, task: Task) => {
      try {
        const startTime = performance.now()

        // 检查是否还有足够的时间执行任务
        if (deadline.timeRemaining() < this.timeSlice) {
          // 如果没有足够时间，将任务放回队列
          this.tasks.get(task.priority)?.unshift(task)
          return 0
        }

        const result = await Promise.race([
          task.fn(),
          task.timeout
            ? new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Task timeout')), task.timeout),
            )
            : Promise.resolve(),
          // 如果超过剩余空闲时间，也中断任务
          new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Idle deadline exceeded'))
            }, deadline.timeRemaining())

            // 清理超时
            Promise.resolve(task.fn()).finally(() => clearTimeout(timeoutId))
          }),
        ])

        const executionTime = performance.now() - startTime
        task.onProgress?.(100)
        task.onComplete?.(result)

        return executionTime
      }
      catch (error: any) {
        if (error.message === 'Idle deadline exceeded') {
          // 将任务放回队列头部
          this.tasks.get(task.priority)?.unshift(task)
          return 0
        }
        task.onError?.(error)
        return 0
      }
    }

    const processBatch = async (deadline: IdleDeadline) => {
      const runningTasks: Promise<number>[] = []
      let remainingTime = deadline.timeRemaining()

      // 按优先级处理任务
      for (const priority of ['high', 'normal', 'low'] as TaskPriority[]) {
        const tasks = this.tasks.get(priority) || []

        while (
          tasks.length > 0
          && remainingTime > this.timeSlice // 确保有足够的时间执行任务
          && runningTasks.length < this.maxConcurrent
        ) {
          const task = tasks.shift()
          if (task) {
            runningTasks.push(processTask(deadline, task))
            // 更新剩余时间估计
            remainingTime = deadline.timeRemaining()
          }
        }

        // 如果剩余时间不足，退出循环
        if (remainingTime <= this.timeSlice)
          break
      }

      if (runningTasks.length > 0) {
        const executionTimes = await Promise.all(runningTasks)
        // 可以用执行时间做一些统计或优化
        const totalExecutionTime = executionTimes.reduce((a, b) => a + b, 0)
        this.adjustTimeSlice(totalExecutionTime / executionTimes.length)
      }
    }

    const scheduleNext = () => {
      if (this.getPendingCount() > 0) {
        requestIdleCallback(async (deadline) => {
          await processBatch(deadline)
          scheduleNext()
        }, {
          timeout: 1000, // 1秒后必须执行
        })
      }
      else {
        this.isProcessing = false
      }
    }

    scheduleNext()
  }

  // 动态调整时间片
  private adjustTimeSlice(avgExecutionTime: number) {
    // 根据平均执行时间调整时间片
    const idealTimeSlice = Math.max(5, Math.min(50, avgExecutionTime * 1.2))
    this.timeSlice = (this.timeSlice * 0.8 + idealTimeSlice * 0.2)
  }
}

// 使用示例
const scheduler = new IdleTaskScheduler(3) // 最多同时执行3个任务

// 添加高优先级任务
scheduler.addTask(
  async () => {
    // 模拟耗时操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'High priority task completed'
  },
  {
    priority: 'high',
    timeout: 2000,
    // onProgress: progress => console.log(`Progress: ${progress}%`),
    // onComplete: result => console.log(result),
    onError: error => console.error('Task failed:', error),
  },
)

// 添加普通优先级任务
scheduler.addTask(
  () => {
    return 'Normal priority task completed'
  },
  {
    // onComplete: result => console.log(result),
  },
)

// 添加低优先级任务
const taskId = scheduler.addTask(
  () => {
    return 'Low priority task completed'
  },
  {
    priority: 'low',
    // onComplete: result => console.log(result),
  },
)

// 取消特定任务
scheduler.cancelTask(taskId)

// 获取待处理任务数量
// console.log(`Pending tasks: ${scheduler.getPendingCount()}`)

// 取消所有任务
// scheduler.cancelAll();
