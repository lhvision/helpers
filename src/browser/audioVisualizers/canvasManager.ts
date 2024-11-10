export interface CanvasSize {
  width: number
  height: number
  centerX: number
  centerY: number
  dirty: boolean
}

export class CanvasManager {
  /** 防抖计时器 */
  private resizeTimer?: number
  /** 画布尺寸 */
  private canvasSize: CanvasSize = {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    dirty: true,
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private onResize?: () => void,
  ) {
    this.setupResizeListener()
  }

  private setupResizeListener() {
    // resize 事件处理
    window.addEventListener('resize', () => {
      // 如果存在计时器，则清除
      if (this.resizeTimer)
        clearTimeout(this.resizeTimer)
      // 标记画布尺寸需要更新
      this.canvasSize.dirty = true
      // 设置计时器
      this.resizeTimer = window.setTimeout(() => this.updateCanvasSize(), 150)
    })
  }

  /** 更新画布尺寸 */
  updateCanvasSize(): CanvasSize {
    // 如果尺寸没有变化且不是脏状态，直接返回缓存的尺寸
    if (!this.canvasSize.dirty
      && this.canvas.width === this.canvasSize.width
      && this.canvas.height === this.canvasSize.height) {
      return this.canvasSize
    }

    const container = this.canvas.parentElement
    if (!container)
      return this.canvasSize

    // 确保容器有明确的尺寸
    if (container.clientHeight === 0)
      container.style.height = '100vh'

    // 获取容器尺寸
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // 设置画布实际尺寸（考虑设备像素比）
    this.canvas.width = containerWidth * window.devicePixelRatio
    this.canvas.height = containerHeight * window.devicePixelRatio

    // 设置画布显示尺寸
    this.canvas.style.width = `${containerWidth}px`
    this.canvas.style.height = `${containerHeight}px`

    // 更新缓存的尺寸
    this.canvasSize = {
      width: this.canvas.width,
      height: this.canvas.height,
      centerX: this.canvas.width / 2,
      centerY: this.canvas.height / 2,
      dirty: false,
    }

    // 触发 onResize 回调
    this.onResize?.()

    return this.canvasSize
  }

  /** 获取当前画布尺寸 */
  getCanvasSize(): CanvasSize {
    return { ...this.canvasSize }
  }

  /** 标记画布需要更新 */
  markDirty() {
    this.canvasSize.dirty = true
  }

  /** 清理资源 */
  cleanup() {
    if (this.resizeTimer)
      clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.setupResizeListener)
  }
}
