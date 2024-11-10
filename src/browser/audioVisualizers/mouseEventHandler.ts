import type { MouseInteraction } from './audioTypes'

export class MouseEventHandler {
  private mouseX?: number
  private mouseY?: number

  constructor(
    private canvas: HTMLCanvasElement,
    private enableMouseInteraction: boolean,
  ) {
    this.setupMouseEvents()
  }

  /** 设置鼠标事件监听 */
  private setupMouseEvents() {
    if (this.enableMouseInteraction) {
      this.canvas.addEventListener('mousemove', this.handleMouseMove)
      this.canvas.addEventListener('mouseleave', this.handleMouseLeave)
    }
  }

  /** 处理鼠标移动事件 */
  private handleMouseMove = (e: MouseEvent) => {
    // 获取设备像素比
    const devicePixelRatio = window.devicePixelRatio
    // 获取画布边界矩形
    const rect = this.canvas.getBoundingClientRect()
    // 设置鼠标X坐标
    this.mouseX = (e.clientX - rect.left) * devicePixelRatio
    // 设置鼠标Y坐标
    this.mouseY = (e.clientY - rect.top) * devicePixelRatio
  }

  /** 处理鼠标离开事件 */
  private handleMouseLeave = () => {
    // 设置鼠标X坐标
    this.mouseX = undefined
    // 设置鼠标Y坐标
    this.mouseY = undefined
  }

  /** 获取鼠标位置 */
  getMousePosition() {
    if (this.mouseX === undefined || this.mouseY === undefined)
      return undefined

    return {
      x: this.mouseX,
      y: this.mouseY,
    }
  }

  /** 计算鼠标交互 */
  calculateMouseInteraction(centerX: number, centerY: number): MouseInteraction {
    // 如果鼠标X坐标或 Y 坐标不存在，返回 false
    if (this.mouseX === undefined || this.mouseY === undefined) {
      return { angle: 0, distance: 0, active: false }
    }

    // 计算鼠标与中心点的X轴距离
    const dx = this.mouseX - centerX
    // 计算鼠标与中心点的Y轴距离
    const dy = this.mouseY - centerY

    return {
      angle: Math.atan2(dy, dx),
      distance: Math.sqrt(dx * dx + dy * dy),
      active: true,
    }
  }

  /** 更新鼠标交互状态 */
  updateMouseInteraction(enableMouseInteraction: boolean) {
    if (this.enableMouseInteraction !== enableMouseInteraction) {
      this.enableMouseInteraction = enableMouseInteraction
      // 移除现有的事件监听器
      this.canvas.removeEventListener('mousemove', this.handleMouseMove)
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
      // 重新设置鼠标事件
      this.setupMouseEvents()
    }
  }

  /** 清理事件监听器 */
  cleanup() {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
  }
}
