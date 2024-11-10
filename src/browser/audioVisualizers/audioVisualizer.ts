import type { AnimationConfig, VisualizerConfig, VisualizerMode } from './audioTypes'
import { AnimationController } from './animationController'
import { AudioDataProcessor } from './audioDataProcessor'
import { CacheManager } from './cacheManager'
import { CanvasManager } from './canvasManager'
import { CenterTextRenderer } from './centerTextRenderer'
import { EffectsCalculator } from './effectsCalculator'
import { GradientManager } from './gradientManager'
import { MonochromeRenderer } from './monochromeRenderer'
import { MouseEventHandler } from './mouseEventHandler'

export class AudioVisualizer {
  /** 是否已初始化 */
  private isInitialized = false
  /** 音频上下文 */
  private audioContext: AudioContext | null = null
  /** 画布 */
  private canvas: HTMLCanvasElement
  /** 画布上下文 */
  private ctx: CanvasRenderingContext2D
  /** 音频元素 */
  private audioElement: HTMLAudioElement
  /** 可视化模式 */
  private mode: VisualizerMode = 'bar'
  /** 可配置参数 */
  private config: Required<VisualizerConfig> = {
    segments: 120,
    baseOpacity: 0.3,
    glowIntensity: 0.7,
    shadowBlur: 15,
    pulseSpeed: 0.001,
    pulseIntensity: 0.03,
    heightMultiplier: 0.7,
    barWidthRatio: 0.6,
    barGapRatio: 0.4,
    circleRadiusRatio: 0.45,
    isDrawReferenceCircles: true,
    enableMouseInteraction: false,
    barMarginRatio: 0.05,
    barHeightRatio: 0.7,
    circularBarHeightRatio: 0.8,
    circularIntensityRatio: 0.3,
    useMonochrome: false,
    enableGlow: false,
    centerText: {
      enabled: true,
      time: {
        enabled: true,
      },
      date: {
        enabled: true,
      },
    },
  }

  /** 缓存管理器 */
  private readonly cacheManager: CacheManager
  /** 中心文本渲染器 */
  private readonly centerTextRenderer: CenterTextRenderer
  /** 鼠标事件处理器 */
  private readonly mouseEventHandler: MouseEventHandler
  /** 单色渲染器 */
  private readonly monochromeRenderer: MonochromeRenderer
  /** 画布管理器 */
  private readonly canvasManager: CanvasManager
  /** 音频数据处理器 */
  private readonly audioDataProcessor: AudioDataProcessor
  /** 动画控制器 */
  private readonly animationController: AnimationController
  /** 渐变管理器 */
  private readonly gradientManager: GradientManager
  /** 效果计算器 */
  private readonly effectsCalculator: EffectsCalculator

  /**
   * 创建音频可视化器
   * @param audioElement 音频元素
   * @param canvas 画布
   * @param fftSize 频谱 FFT 大小，默认 256，必须是 2 的幂次方，决定了频率数据的精度
   */
  constructor(audioElement: HTMLAudioElement, canvas: HTMLCanvasElement, fftSize = 256) {
    this.audioElement = audioElement
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })!
    this.cacheManager = new CacheManager()
    this.centerTextRenderer = new CenterTextRenderer(this.ctx)
    this.mouseEventHandler = new MouseEventHandler(canvas, this.config.enableMouseInteraction)
    this.monochromeRenderer = new MonochromeRenderer(this.ctx)
    this.canvasManager = new CanvasManager(canvas)
    this.audioDataProcessor = new AudioDataProcessor(fftSize)
    this.animationController = new AnimationController(
      // 渲染回调
      () => this.renderFrame(),
      // 预计算回调
      () => this.precalculateNextFrame(),
      // 清理回调
      () => this.cacheManager.cleanCache(),
    )
    this.gradientManager = new GradientManager(this.ctx, {
      baseOpacity: this.config.baseOpacity,
      glowIntensity: this.config.glowIntensity,
      shadowBlur: this.config.shadowBlur,
    }, this.cacheManager)
    this.effectsCalculator = new EffectsCalculator(
      {
        heightMultiplier: this.config.heightMultiplier,
        pulseSpeed: this.config.pulseSpeed,
        pulseIntensity: this.config.pulseIntensity,
        circularIntensityRatio: this.config.circularIntensityRatio,
        enableMouseInteraction: this.config.enableMouseInteraction,
      },
      this.cacheManager,
    )
  }

  /** 初始化方法 */
  async init() {
    if (this.isInitialized) {
      console.warn('AudioVisualizer is already initialized')
      return
    }

    try {
      this.canvasManager.updateCanvasSize()

      // 创建音频上下文
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }

      // 初始化音频处理器
      await this.audioDataProcessor.init(this.audioContext, this.audioElement)

      // 开始动画循环
      this.animationController.start()
      this.isInitialized = true
    }
    catch (error) {
      console.error('Failed to initialize audio visualizer:', error)
    }
  }

  /** 核心渲染逻辑 */
  private renderFrame() {
    // 获取处理后的音频数据
    const interpolatedData = this.audioDataProcessor.processAudioData(this.config.segments)
    if (!interpolatedData)
      return

    // 保存画布状态
    this.ctx.save()
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.mode === 'bar')
      this.drawBars()
    else
      this.drawCircular()

    // 恢复画布状态
    this.ctx.restore()
  }

  /** 预计算下一帧可能用到的值 */
  private precalculateNextFrame() {
    // 预计算三角函数值
    if (this.mode === 'circular') {
      const angles = this.calculateCircularAngles(this.config.segments)
      angles.forEach((angle) => {
        this.cacheManager.getCachedSin(angle)
        this.cacheManager.getCachedCos(angle)
      })
    }
    else {
      // 预计算条形位置
      this.calculateBarPositions(this.canvas.width)
    }
    // 预计算脉冲效果
    this.effectsCalculator.calculatePulseEffect()
  }

  /** 暂停可视化 */
  pause() {
    if (this.isInitialized) {
      this.animationController.stop()
    }
  }

  /** 停止动画 */
  stop() {
    this.animationController.stop()
  }

  /** 恢复动画 */
  resume() {
    if (this.isInitialized) {
      this.animationController.resume()
    }
  }

  /** 预计算条形图位置 */
  private calculateBarPositions(canvasWidth: number) {
    const w = Math.round(canvasWidth)
    const m = Math.round(this.config.barMarginRatio * 100)
    const bw = Math.round(this.config.barWidthRatio * 100)
    const bg = Math.round(this.config.barGapRatio * 100)
    const cacheKey = `${w}-${this.config.segments}-${m}-${bw}-${bg}`
    const cached = this.cacheManager.cache.barPositions.get(cacheKey)
    if (cached)
      return cached
    // 计算边距
    const margin = canvasWidth * this.config.barMarginRatio
    // 计算可用宽度
    const availableWidth = canvasWidth - (margin * 2)

    // 计算单个分段的总宽度（包含条形和间隙）
    const segmentWidth = availableWidth / this.config.segments

    // 根据比例计算条形宽度，但确保不超过分段宽度
    const barWidth = Math.min(
      segmentWidth * this.config.barWidthRatio,
      segmentWidth * 0.99,
    )

    // 计算实际的间隙，确保不会导致溢出，确保间隙不会超过剩余空间
    const gap = Math.min(
      barWidth * this.config.barGapRatio,
      (segmentWidth - barWidth),
    )

    // 创建条形位置数组
    const positions = []
    // 初始化X坐标
    let x = margin
    // 遍历条形
    for (let i = 0; i < this.config.segments; i++) {
      positions.push({ x, width: barWidth })
      x += barWidth + gap
    }

    // 缓存条形位置
    this.cacheManager.cache.barPositions.set(cacheKey, positions)
    return positions
  }

  /** 预计算圆形角度 */
  private calculateCircularAngles(segments: number) {
    // 获取缓存
    const cached = this.cacheManager.cache.circularAngles.get(segments)
    // 如果缓存存在，则返回
    if (cached)
      return cached

    // 计算角度步长
    const angleStep = (2 * Math.PI) / segments
    // 创建角度数组
    const angles = Array.from({ length: segments }, (_, i) => i * angleStep)

    // 缓存角度数组
    this.cacheManager.cache.circularAngles.set(segments, angles)
    return angles
  }

  /** 创建并缓存背景渐变 */
  private getBackgroundGradient(centerX: number, centerY: number) {
    const cacheKey = `${centerX}-${centerY}`
    const cached = this.cacheManager.cache.backgroundGradient.get(cacheKey)
    if (cached)
      return cached
    // 创建径向渐变背景
    const gradient = this.gradientManager.createRadialGradient(centerX, centerY)
    // 缓存背景渐变
    this.cacheManager.cache.backgroundGradient.set(cacheKey, gradient)
    return gradient
  }

  /** 条形图绘制 */
  private drawBars() {
    // 获取画布中心坐标
    const { centerX, centerY } = this.canvasManager.getCanvasSize()
    // 计算条形位置
    const barPositions = this.calculateBarPositions(this.canvas.width)
    // 处理频谱数据
    const interpolatedData = this.audioDataProcessor.processAudioData(this.config.segments)
    if (!interpolatedData)
      return

    // 绘制背景 - 使用缓存的背景渐变
    const bgGradient = this.getBackgroundGradient(centerX, centerY)
    // 设置背景填充样式
    this.ctx.fillStyle = bgGradient
    // 绘制背景
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 计算脉冲效果
    const pulseEffect = this.effectsCalculator.calculatePulseEffect()
    // 计算高度倍数
    const heightMultiplier = this.config.heightMultiplier * pulseEffect

    if (this.config.useMonochrome) {
      // 单色模式批量处理
      for (let i = 0; i < this.config.segments; i++) {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 如果幅度小于0.001，则跳过
        if (amplitude < 0.001)
          continue
        // 获取条形位置
        const { x, width } = barPositions[i]
        // 计算条形高度
        const barHeight = amplitude * this.canvas.height * this.config.barHeightRatio * heightMultiplier
        // 绘制单色条形
        this.monochromeRenderer.drawMonochromeBarGradient(
          x,
          this.canvas.height - barHeight,
          width,
          barHeight,
          amplitude,
        )
      }
    }
    else {
      // 彩色模式批量处理
      // 预先创建所有渐变
      const gradients = Array.from({ length: this.config.segments }, (_, i) => {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        return this.gradientManager.createGradient(i, amplitude, this.config.segments)
      })

      for (let i = 0; i < this.config.segments; i++) {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 如果幅度小于0.001，则跳过
        if (amplitude < 0.001)
          continue
        // 获取条形位置
        const { x, width } = barPositions[i]
        // 计算条形高度
        const barHeight = amplitude * this.canvas.height * this.config.barHeightRatio * heightMultiplier
        // 获取渐变
        const { color, gradient } = gradients[i]
        // 创建线性渐变
        const barGradient = this.ctx.createLinearGradient(
          x,
          this.canvas.height - barHeight,
          x,
          this.canvas.height,
        )
        // 添加渐变颜色
        gradient.forEach((color, index) => barGradient.addColorStop(index * 0.5, color))
        // 设置发光效果
        this.gradientManager.setGlowEffect(color, amplitude)
        // 设置填充样式
        this.ctx.fillStyle = barGradient
        // 绘制条形
        this.ctx.fillRect(x, this.canvas.height - barHeight, width, barHeight)
      }
    }

    // 重置发光效果
    this.gradientManager.resetGlowEffect()
  }

  /** 圆形可视化绘制 */
  private drawCircular() {
    // 获取画布中心坐标和基础数据，只计算一次
    const { centerX, centerY } = this.canvasManager.getCanvasSize()
    // 计算圆形半径
    const radius = Math.min(centerX, centerY) * this.config.circleRadiusRatio
    // 计算脉冲效果
    const pulseEffect = this.effectsCalculator.calculatePulseEffect()
    // 计算脉冲半径
    const pulseRadius = radius * pulseEffect
    // 计算线条宽度
    const lineWidth = 2 * window.devicePixelRatio

    // 绘制背景 - 使用缓存的背景渐变
    const bgGradient = this.getBackgroundGradient(centerX, centerY)
    // 设置背景填充样式
    this.ctx.fillStyle = bgGradient
    // 绘制背景
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 批量绘制参考圆环
    if (this.config.isDrawReferenceCircles) {
      this.drawReferenceCircles(centerX, centerY, radius)
    }

    if (this.config.enableGlow) {
      // 添加动态光晕
      const glowGradient = this.gradientManager.createDynamicGlow(centerX, centerY, radius, this.config.pulseSpeed)
      // 设置背景填充样式
      this.ctx.fillStyle = glowGradient
      // 绘制背景
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    // 获取预计算的角度数组
    const angles = this.calculateCircularAngles(this.config.segments)

    // 处理鼠标交互
    const mouseInteraction = this.mouseEventHandler.calculateMouseInteraction(centerX, centerY)

    // 处理频谱数据
    const interpolatedData = this.audioDataProcessor.processAudioData(this.config.segments)
    if (!interpolatedData)
      return

    // 批量处理单色模式和彩色模式
    if (this.config.useMonochrome) {
      // 单色模式批量处理
      for (let i = 0; i < this.config.segments; i++) {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 如果幅度小于0.001，则跳过
        if (amplitude < 0.001)
          continue

        // 计算角度
        const angle = angles[i]
        // 计算高度乘数
        const heightMultiplier = this.effectsCalculator.calculateCircularHeightMultiplier(i, this.config.segments)
        // 计算交互倍数
        const interactionMultiplier = this.effectsCalculator.calculateInteractionMultiplier(angle, radius, mouseInteraction)
        // 计算条形高度
        const barHeight = amplitude * (radius * this.config.circularBarHeightRatio) * heightMultiplier * interactionMultiplier

        // 计算圆形点
        const [x1, y1] = this.getCircularPoint(centerX, centerY, pulseRadius, angle)
        const [x2, y2] = this.getCircularPoint(centerX, centerY, pulseRadius + barHeight, angle)

        // 绘制单色线条
        this.monochromeRenderer.drawMonochromeLineGradient(x1, y1, x2, y2, amplitude, lineWidth, angle)
      }
    }
    else {
      // 彩色模式批量处理
      this.ctx.lineWidth = lineWidth

      // 预先创建所有需要的渐变
      const gradients = Array.from({ length: this.config.segments }, (_, i) => {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 创建渐变
        return this.gradientManager.createGradient(i, amplitude, this.config.segments)
      })

      for (let i = 0; i < this.config.segments; i++) {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 如果幅度小于0.001，则跳过
        if (amplitude < 0.001)
          continue

        // 计算角度
        const angle = angles[i]
        // 计算高度乘数
        const heightMultiplier = this.effectsCalculator.calculateCircularHeightMultiplier(i, this.config.segments)
        // 计算交互倍数
        const interactionMultiplier = this.effectsCalculator.calculateInteractionMultiplier(angle, radius, mouseInteraction)
        // 计算条形高度
        const barHeight = amplitude * (radius * this.config.circularBarHeightRatio) * heightMultiplier * interactionMultiplier
        // 计算圆形点
        const [x1, y1] = this.getCircularPoint(centerX, centerY, pulseRadius, angle)
        const [x2, y2] = this.getCircularPoint(centerX, centerY, pulseRadius + barHeight, angle)

        // 使用预先创建的渐变
        const { color, gradient } = gradients[i]
        // 创建线性渐变
        const lineGradient = this.ctx.createLinearGradient(x1, y1, x2, y2)
        // 添加渐变颜色
        gradient.forEach((color, index) => lineGradient.addColorStop(index * 0.5, color))
        // 设置发光效果
        this.gradientManager.setGlowEffect(color, amplitude)
        // 绘制线条
        this.ctx.beginPath()
        // 设置线条样式
        this.ctx.strokeStyle = lineGradient
        // 移动到起点
        this.ctx.moveTo(x1, y1)
        // 绘制到终点
        this.ctx.lineTo(x2, y2)
        // 绘制线条
        this.ctx.stroke()
      }
    }

    // 重置发光效果
    this.gradientManager.resetGlowEffect()

    // 在重置效果后绘制中心文本
    this.centerTextRenderer.drawCenterText(centerX, centerY, radius, this.config.centerText)
  }

  /** 绘制参考圆环 */
  private drawReferenceCircles(centerX: number, centerY: number, radius: number) {
    // 获取脉冲效果
    const pulseEffect = this.effectsCalculator.calculatePulseEffect()
    // 计算圆环半径
    const circleRadius = radius * pulseEffect
    // 开始绘制圆环路径
    this.ctx.beginPath()
    // 绘制圆环路径
    this.ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    // 设置圆环填充样式
    this.ctx.strokeStyle = `rgba(255, 255, 255, 0.04)`
    // 设置圆环宽度
    this.ctx.lineWidth = 1 * window.devicePixelRatio
    // 绘制圆环
    this.ctx.stroke()
    // 遍历参考圆环
    // for (let i = 1; i <= this.config.referenceCircles; i++) {
    //   // 计算圆环半径，添加脉冲效果
    //   const circleRadius = radius * (i / this.config.referenceCircles) * pulseEffect

    //   this.ctx.beginPath()
    //   // 绘制圆环路径
    //   this.ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    //   // 设置圆环填充样式
    //   this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + (i / this.config.referenceCircles) * 0.02})`
    //   // 设置圆环宽度
    //   this.ctx.lineWidth = 1 * window.devicePixelRatio
    //   // 绘制圆环
    //   this.ctx.stroke()
    // }
  }

  /** 计算圆形上的点 */
  private getCircularPoint(centerX: number, centerY: number, radius: number, angle: number): [number, number] {
    // 减少精度以提高缓存命中率，同时保持视觉效果
    const cx = Math.round(centerX)
    const cy = Math.round(centerY)
    const r = Math.round(radius * 10) // 保留一位小数的精度
    const a = Math.round(angle * 1000) // 保留三位小数的精度
    // 使用分隔符来避免数值混淆
    const cacheKey = `${cx}|${cy}|${r}|${a}`
    const cached = this.cacheManager.cache.circularPoints.get(cacheKey)
    if (cached)
      return cached

    // 使用已有的缓存三角函数
    const cos = this.cacheManager.getCachedCos(angle)
    const sin = this.cacheManager.getCachedSin(angle)

    // 计算圆形上的点
    const point: [number, number] = [
      centerX + radius * cos,
      centerY + radius * sin,
    ]

    this.cacheManager.cache.circularPoints.set(cacheKey, point)
    return point
  }

  /** 配置更新方法 */
  public updateConfig(newConfig: Partial<VisualizerConfig>) {
    const { centerText, ...rest } = newConfig
    this.config = {
      ...this.config,
      ...rest,
      centerText: {
        ...this.config.centerText,
        ...centerText,
      },
    }

    // 更新渐变管理器配置
    this.gradientManager.updateConfig({
      baseOpacity: this.config.baseOpacity,
      glowIntensity: this.config.glowIntensity,
      shadowBlur: this.config.shadowBlur,
    })

    // 更新效果计算器配置
    this.effectsCalculator.updateConfig({
      heightMultiplier: this.config.heightMultiplier,
      pulseSpeed: this.config.pulseSpeed,
      pulseIntensity: this.config.pulseIntensity,
      circularIntensityRatio: this.config.circularIntensityRatio,
      enableMouseInteraction: this.config.enableMouseInteraction,
    })

    // 更新鼠标交互状态
    this.mouseEventHandler.updateMouseInteraction(this.config.enableMouseInteraction)

    // 在其他可能改变画布尺寸的地方也要标记 dirty
    this.canvasManager.markDirty()
  }

  /** 更新动画控制器配置 */
  updateAnimationController(newConfig: Partial<AnimationConfig>) {
    this.animationController.updateConfig(newConfig)
  }

  /** 获取动画控制器 */
  getAnimationController() {
    return this.animationController.getConfig()
  }

  /** 获取当前配置 */
  getConfig(): VisualizerConfig {
    return { ...this.config }
  }

  /** 设置可视化模式 */
  setMode(mode: VisualizerMode) {
    this.mode = mode
  }

  /** 获取当前状态 */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isAnimating: this.animationController.getConfig().isAnimating,
      mode: this.mode,
    }
  }

  /** 清理资源 */
  destroy() {
    this.stop()
    // 停止动画
    this.animationController.cleanup()
    // 清理音频处理器
    this.audioDataProcessor.cleanup()
    // 清理鼠标事件
    this.mouseEventHandler.cleanup()
    // 清理画布管理器
    this.canvasManager.cleanup()
    // 清理缓存
    this.cacheManager.clearAllCache()
    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
