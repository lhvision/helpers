import type { MouseInteraction, VisualizerConfig } from './audioTypes'
import type { CacheManager } from './cacheManager'

type EffectsConfig = Required<
  Pick<
    VisualizerConfig,
    | 'heightMultiplier'
    | 'pulseSpeed'
    | 'pulseIntensity'
    | 'circularIntensityRatio'
    | 'enableMouseInteraction'
  >
>

export class EffectsCalculator {
  constructor(
    private config: EffectsConfig,
    private cacheManager: CacheManager,
  ) {}

  /** 计算脉冲效果 */
  calculatePulseEffect(): number {
    // 使用缓存键
    const cacheKey = `pulse-${Date.now() >> 6}`
    const cached = this.cacheManager.cache.pulseEffects.get(cacheKey)
    if (cached)
      return cached

    // 计算脉冲效果
    const pulseEffect = 1
      + this.cacheManager.getCachedSin(Date.now() * this.config.pulseSpeed)
      * this.config.pulseIntensity

    // 缓存结果
    this.cacheManager.cache.pulseEffects.set(cacheKey, pulseEffect)

    return pulseEffect
  }

  /** 计算圆形可视化的高度乘数 */
  calculateCircularHeightMultiplier(i: number, segments: number): number {
    // 使用缓存键
    const cacheKey = `circular-height-${i}-${segments}`
    const cached = this.cacheManager.cache.heightMultipliers.get(cacheKey)
    if (cached)
      return cached

    // 计算高度乘数
    const heightMultiplier = this.config.heightMultiplier
      + (this.cacheManager.getCachedSin((i / segments) * Math.PI)
        * this.config.circularIntensityRatio)

    // 缓存结果
    this.cacheManager.cache.heightMultipliers.set(cacheKey, heightMultiplier)

    return heightMultiplier
  }

  /** 计算交互乘数 */
  calculateInteractionMultiplier(
    angle: number,
    radius: number,
    mouseInteraction: MouseInteraction,
  ): number {
    if (!this.config.enableMouseInteraction || !mouseInteraction.active)
      return 1

    // 计算角度差
    const angleDiff = Math.abs(angle - mouseInteraction.angle)

    // 计算距离效果
    const distanceEffect = Math.max(
      0,
      1 - Math.abs(mouseInteraction.distance - radius) / 100,
    )

    // 如果角度差小于阈值，计算交互效果
    return 1 + (angleDiff < 0.5 ? (1 - angleDiff * 2) * distanceEffect : 0)
  }

  /** 更新配置 */
  updateConfig(newConfig: Partial<EffectsConfig>) {
    Object.assign(this.config, newConfig)
  }
}
