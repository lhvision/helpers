import type { CacheStore } from './audioTypes'

export class CacheManager {
  private _cache: CacheStore

  constructor() {
    this._cache = {
      gradients: new Map(),
      pulseEffects: new Map(),
      heightMultipliers: new Map(),
      circularPoints: new Map(),
      barPositions: new Map(),
      circularAngles: new Map(),
      backgroundGradient: new Map(),
      trigCache: {
        sin: new Map(),
        cos: new Map(),
        atan2: new Map(),
      },
    }
  }

  // 只需要 getter 即可
  get cache(): CacheStore {
    return this._cache
  }

  /** 获取缓存的 sin 值 */
  getCachedSin(angle: number): number {
    // 计算缓存键
    const key = Math.round(angle * 1000) // 保留三位小数精度
    // 获取缓存
    let value = this._cache.trigCache.sin.get(key)
    // 如果缓存不存在，则计算并缓存
    if (value === undefined) {
      value = Math.sin(angle)
      this._cache.trigCache.sin.set(key, value)
    }
    return value
  }

  /** 获取缓存的 cos 值 */
  getCachedCos(angle: number): number {
    // 计算缓存键
    const key = Math.round(angle * 1000)
    // 获取缓存
    let value = this._cache.trigCache.cos.get(key)
    // 如果缓存不存在，则计算并缓存
    if (value === undefined) {
      value = Math.cos(angle)
      this._cache.trigCache.cos.set(key, value)
    }
    return value
  }

  /** 获取缓存的 atan2 值 */
  getCachedAtan2(y: number, x: number): number {
    const kx = Math.round(x * 1000)
    const ky = Math.round(y * 1000)
    const key = `${kx}-${ky}`
    let value = this._cache.trigCache.atan2.get(key)
    if (value === undefined) {
      value = Math.atan2(y, x)
      this._cache.trigCache.atan2.set(key, value)
    }
    return value
  }

  /** 清理缓存 */
  cleanCache() {
    if (this._cache.gradients.size > 1000)
      this._cache.gradients.clear()
    if (this._cache.pulseEffects.size > 1000)
      this._cache.pulseEffects.clear()
    if (this._cache.heightMultipliers.size > 1000)
      this._cache.heightMultipliers.clear()
    if (this._cache.circularPoints.size > 2000)
      this._cache.circularPoints.clear()
    if (this._cache.barPositions.size > 10)
      this._cache.barPositions.clear()
    if (this._cache.backgroundGradient.size > 10)
      this._cache.backgroundGradient.clear()
    if (this._cache.trigCache.sin.size > 1000)
      this._cache.trigCache.sin.clear()
    if (this._cache.trigCache.cos.size > 1000)
      this._cache.trigCache.cos.clear()
    if (this._cache.trigCache.atan2.size > 1000)
      this._cache.trigCache.atan2.clear()
  }

  /** 清理所有缓存 */
  clearAllCache() {
    this._cache.gradients.clear()
    this._cache.pulseEffects.clear()
    this._cache.heightMultipliers.clear()
    this._cache.circularPoints.clear()
    this._cache.barPositions.clear()
    this._cache.circularAngles.clear()
    this._cache.backgroundGradient.clear()
    this._cache.trigCache.sin.clear()
    this._cache.trigCache.cos.clear()
    this._cache.trigCache.atan2.clear()
  }
}
