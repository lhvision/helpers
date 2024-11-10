import type { VisualizerConfig } from './audioTypes'
import type { CacheManager } from './cacheManager'

type GradientConfig = Required<Pick<VisualizerConfig, 'baseOpacity' | 'glowIntensity' | 'shadowBlur'>>

export class GradientManager {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private config: GradientConfig,
    private cacheManager: CacheManager,
  ) {}

  /** 创建颜色渐变 */
  createGradient(i: number, amplitude: number, segments: number) {
    const amp = Math.round(amplitude * 1000)
    const cacheKey = `${i}-${amp}-${segments}`
    const cached = this.cacheManager.cache.gradients.get(cacheKey)
    if (cached)
      return cached
    // 计算色调
    const hue = (i / segments) * 360
    // 创建渐变
    const gradient = {
      color: `hsla(${hue}, 100%, 50%, ${this.config.baseOpacity + amplitude * this.config.glowIntensity})`,
      gradient: [
        `hsla(${hue}, 100%, 75%, ${this.config.baseOpacity + amplitude * 0.4})`,
        `hsla(${hue}, 100%, 65%, ${0.6 + amplitude * 0.2})`,
        `hsla(${hue}, 100%, 55%, 0.8)`,
      ],
    }

    this.cacheManager.cache.gradients.set(cacheKey, gradient)
    return gradient
  }

  /** 创建动态光晕 */
  createDynamicGlow(centerX: number, centerY: number, radius: number, pulseSpeed: number) {
    const cx = Math.round(centerX * 10)
    const cy = Math.round(centerY * 10)
    const r = Math.round(radius * 10)
    const cacheKey = `dynamic-glow-${cx}-${cy}-${r}`
    const cached = this.cacheManager.cache.backgroundGradient.get(cacheKey)
    if (cached)
      return cached
    // 创建径向渐变
    const glowGradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.8,
      centerX,
      centerY,
      radius * 1.2,
    )

    // 添加渐变颜色
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
    glowGradient.addColorStop(
      0.5,
      `rgba(128, 128, 255, ${0.05 + Math.sin(Date.now() * pulseSpeed) * 0.02})`,
    )
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    this.cacheManager.cache.backgroundGradient.set(cacheKey, glowGradient)
    return glowGradient
  }

  /** 创建径向渐变背景 */
  createRadialGradient(centerX: number, centerY: number) {
    // 创建径向渐变背景
    const bgGradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(centerX, centerY),
    )

    // 添加渐变颜色
    bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    bgGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    // bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)')
    // bgGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.90)')
    // bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')

    return bgGradient
  }

  /** 设置发光效果 */
  setGlowEffect(color: string, amplitude: number) {
    // 设置阴影颜色
    this.ctx.shadowColor = color
    // 设置阴影模糊值
    this.ctx.shadowBlur = (this.config.shadowBlur + amplitude * 10) * window.devicePixelRatio
  }

  /** 重置发光效果 */
  resetGlowEffect() {
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
  }

  /** 更新配置 */
  updateConfig(newConfig: Partial<GradientConfig>) {
    Object.assign(this.config, newConfig)
  }
}
