import type { AnimationConfig } from './audioTypes'

export class AnimationController {
  private animationFrameId?: number
  private config: AnimationConfig = {
    isAnimating: false,
    lastFrameTime: 0,
    TARGET_FPS: 60,
    FRAME_INTERVAL: 1000 / 60,
    IDLE_TIMEOUT: 50,
  }

  /**
   * 创建动画控制器
   * @param renderCallback 渲染回调
   * @param precalculateCallback 预计算回调
   * @param cleanupCallback 清理回调
   */
  constructor(
    private renderCallback: () => void,
    private precalculateCallback: () => void,
    private cleanupCallback: () => void,
  ) {}

  /** 开始动画 */
  start() {
    this.config.isAnimating = true
    this.animate()
  }

  /** 停止动画 */
  stop() {
    this.config.isAnimating = false
    if (this.animationFrameId)
      cancelAnimationFrame(this.animationFrameId)
  }

  /** 恢复动画 */
  resume() {
    if (!this.config.isAnimating) {
      this.config.isAnimating = true
      this.animate()
    }
  }

  /** 动画循环 */
  private animate(timestamp = 0) {
    // 如果不在动画中,直接返回
    if (!this.config.isAnimating)
      return

    // 计算帧间隔
    const elapsed = timestamp - this.config.lastFrameTime

    // 如果距离上一帧的时间小于目标帧间隔,跳过这一帧
    if (elapsed < this.config.FRAME_INTERVAL) {
      this.animationFrameId = requestAnimationFrame(time => this.animate(time))
      return
    }

    // 更新上一帧时间
    this.config.lastFrameTime = timestamp

    // 使用 requestIdleCallback 处理非关键渲染任务
    requestIdleCallback(
      (deadline) => {
        // 在空闲时间内处理缓存清理，每 5 秒执行一次，< 16 表示在这5秒的循环中，只在前 16 毫秒内执行清理操作
        if (deadline.timeRemaining() > 0 && Date.now() % 5000 < 16) {
          this.cleanupCallback()
        }

        // 在空闲时间内预计算下一帧可能用到的值
        if (deadline.timeRemaining() > 0) {
          this.precalculateCallback()
        }
      },
      { timeout: this.config.IDLE_TIMEOUT },
    )

    // 执行核心渲染逻辑
    this.renderCallback()

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(time => this.animate(time))
  }

  /** 更新配置 */
  updateConfig(newConfig: Partial<AnimationConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
    }
  }

  /** 获取配置 */
  getConfig(): AnimationConfig {
    return { ...this.config }
  }

  /** 清理资源 */
  cleanup() {
    this.stop()
  }
}
