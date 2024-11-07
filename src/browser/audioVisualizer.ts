type VisualizerMode = 'bar' | 'circular'

// 可视化器配置接口
interface VisualizerConfig {
  /**
   * 频谱分段数
   * @defaultValue 120
   */
  segments?: number
  /** 基础透明度，范围：0-1 */
  baseOpacity?: number
  /** 发光强度，范围：0-1 */
  glowIntensity?: number
  /** 阴影模糊值 */
  shadowBlur?: number
  /**
   * 脉冲速度：控制呼吸效果的频率，决定多久完成一次呼吸循环，与 pulseIntensity 共同影响圆环和频谱的动态效果
   * 单位：毫秒的倒数（ms⁻¹）
   * 较大的值会使呼吸更快，较小的值会使呼吸更慢
   * 推荐范围：0.0005 ~ 0.003
   * @defaultValue 0.001
   */
  pulseSpeed?: number
  /**
   * 脉冲强度：控制呼吸效果的幅度，决定每次呼吸时缩放的程度，与 pulseSpeed 共同影响圆环和频谱的动态效果
   * 较大的值会使缩放效果更明显，较小的值会使缩放更微妙
   * 推荐范围：0.01 ~ 0.1
   * @defaultValue 0.03
   */
  pulseIntensity?: number
  /** 高度倍数，范围：0-1 */
  heightMultiplier?: number
  /** 条形宽度比例，范围：0-1 */
  barWidthRatio?: number
  /** 条形间隙比例，范围：0-1 */
  barGapRatio?: number
  /** 圆形半径比例，范围：0-1 */
  circleRadiusRatio?: number
  /** 是否绘制参考圆环 */
  isDrawReferenceCircles?: boolean
  /** 是否启用鼠标交互 */
  enableMouseInteraction?: boolean
  /** 条形图边距比例，范围：0-1 */
  barMarginRatio?: number
  /** 条形图高度基础比例，范围：0-1 */
  barHeightRatio?: number
  /** 圆形频谱线条长度比例，范围：0-1 */
  circularBarHeightRatio?: number
  /** 圆形频谱强度系数，范围：0-1 */
  circularIntensityRatio?: number
  /** 是否使用单色透明效果 */
  useMonochrome?: boolean
  /** 是否启用发光效果 */
  enableGlow?: boolean
  /** 圆环中心文本配置 */
  centerText?: CenterTextConfig
}

// 添加缓存接口
interface CacheStore {
  /** 渐变 */
  gradients: Map<string, {
    color: string
    gradient: string[]
  }>
  /** 动态效果 */
  dynamicEffects: Map<string, {
    heightMultiplier: number
    pulseEffect: number
  }>
  /** 圆形点 */
  circularPoints: Map<string, [number, number]>
  /** 条形位置 */
  barPositions: Map<string, Array<{ x: number, width: number }>>
  /** 圆形角度 */
  circularAngles: Map<number, number[]>
  /** 背景渐变 */
  backgroundGradient: Map<string, CanvasGradient>
  /** 三角函数缓存 */
  trigCache: {
    sin: Map<number, number>
    cos: Map<number, number>
    atan2: Map<string, number>
  }
}

// 修改配置接口
interface CenterTextConfig {
  /** 是否启用中心文本显示 */
  enabled: boolean
  /** 时间显示配置 */
  time?: {
    enabled: boolean
    /**
     * 字体大小比例（相对于圆形半径）范围：0-1
     * @defaultValue 0.05
     */
    fontSizeRatio?: number
    /**
     * Y轴偏移比例（相对于圆形半径，负值向上）
     * @defaultValue 0.05
     */
    offsetYRatio?: number
    /** 颜色 */
    color?: string
    /** 字体，默认 'Monaco' */
    fontFamily?: string
  }
  /** 日期显示配置 */
  date?: {
    /** 是否启用日期显示 */
    enabled: boolean
    /**
     * 字体大小比例（相对于圆形半径）范围：0-1
     * @defaultValue 0.05
     */
    fontSizeRatio?: number
    /**
     * Y轴偏移比例（相对于圆形半径，负值向上）范围：0-1
     * @defaultValue 0.05
     */
    offsetYRatio?: number
    /** 颜色 */
    color?: string
    /** 字体，默认 'Arial' */
    fontFamily?: string
  }
  /** 自定义文本配置 */
  custom?: {
    /** 是否启用自定义文本显示 */
    enabled: boolean
    /** 自定义文本 */
    text: string
    /** 字体大小比例（相对于圆形半径）范围：0-1 */
    fontSizeRatio?: number
    /** Y轴偏移比例（相对于圆形半径，负值向上）范围：0-1 */
    offsetYRatio?: number
    /** 颜色 */
    color?: string
    /** 字体，默认 'Arial' */
    fontFamily?: string
    /** 动画效果 */
    animation?: {
      /**
       * 动画类型
       * 1. fade：渐变
       * 2. slide：滑动
       * 3. none：无动画
       */
      type?: 'fade' | 'slide' | 'none'
      /** 动画持续时间（毫秒） */
      duration?: number
    }
  }
}

export class AudioVisualizer {
  /** 音频上下文 */
  private audioContext: AudioContext | null = null
  /** 分析器 */
  private analyser: AnalyserNode | null = null
  /**
   * 频谱FFT大小
   * @defaultValue 256
   */
  private fftSize: number
  /** 画布 */
  private canvas: HTMLCanvasElement
  /** 画布上下文 */
  private ctx: CanvasRenderingContext2D
  /** 频谱数据 */
  private dataArray: Uint8Array | null = null
  /** 音频元素 */
  private audioElement: HTMLAudioElement
  /** 可视化模式 */
  private mode: VisualizerMode = 'bar'
  /** 鼠标X坐标 */
  private mouseX?: number
  /** 鼠标Y坐标 */
  private mouseY?: number
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

  /** 缓存存储 */
  private cache: CacheStore = {
    gradients: new Map(),
    dynamicEffects: new Map(),
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

  /** 防抖计时器 */
  private resizeTimer?: number

  /** 画布尺寸 */
  private canvasSize = {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    dirty: true,
  }

  private readonly monochromeGradientTemplate = {
    bar: null as CanvasGradient | null,
    line: null as CanvasGradient | null,
  }

  private drawCenterTextCache = {
    lastTimeString: '',
    lastDateString: '',
    lastUpdateTime: 0,
    lastCustomText: '',
    customTextAnimationStart: 0,
  }

  /**
   * 构造函数
   * @param audioElement 音频元素
   * @param canvas 画布
   * @param fftSize 频谱 FFT 大小，默认 256，必须是 2 的幂次方，决定了频率数据的精度
   */
  constructor(audioElement: HTMLAudioElement, canvas: HTMLCanvasElement, fftSize = 256) {
    this.audioElement = audioElement
    this.canvas = canvas
    this.fftSize = fftSize
    this.ctx = canvas.getContext('2d', { alpha: true })!
    this.setupMouseEvents()

    // resize 事件处理
    window.addEventListener('resize', () => {
      // 如果存在计时器，则清除
      if (this.resizeTimer)
        clearTimeout(this.resizeTimer)
      // 标记画布尺寸需要更新
      this.canvasSize.dirty = true
      // 设置计时器
      this.resizeTimer = window.setTimeout(() => this.setupCanvas(), 150)
    })
  }

  /** 初始化方法 */
  async init() {
    // 创建音频上下文
    this.audioContext = new AudioContext()
    // 创建音频源
    const source = this.audioContext.createMediaElementSource(this.audioElement)
    // 创建分析器
    this.analyser = this.audioContext.createAnalyser()

    // 连接音频源和分析器
    source.connect(this.analyser)
    // 连接分析器到音频上下文的输出
    this.analyser.connect(this.audioContext.destination)

    // 设置分析器FFT大小，必须是2的幂次方，决定了频率数据的精度
    this.analyser.fftSize = this.fftSize
    // 获取频谱数据数组长度
    const bufferLength = this.analyser.frequencyBinCount
    // 创建频谱数据数组
    this.dataArray = new Uint8Array(bufferLength)

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.setupCanvas())

    // 开始动画循环
    this.animate()
  }

  /** 动画循环 */
  animate() {
    // 如果分析器或频谱数据数组不存在，返回
    if (!this.analyser || !this.dataArray)
      return

    // 保存当前状态
    this.ctx.save()
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // 获取频谱数据
    this.analyser.getByteFrequencyData(this.dataArray)

    // 绘制条形图
    if (this.mode === 'bar') {
      this.drawBars()
    }
    // 绘制圆形图
    else {
      this.drawCircular()
    }

    // 恢复当前状态
    this.ctx.restore()

    // 定期清理缓存
    if (Date.now() % 5000 < 16) { // 每5秒左右清理一次
      this.cleanCache()
    }

    // 请求动画帧
    requestAnimationFrame(() => this.animate())
  }

  /** 预计算条形图位置 */
  private calculateBarPositions(canvasWidth: number) {
    const w = Math.round(canvasWidth)
    const m = Math.round(this.config.barMarginRatio * 100)
    const bw = Math.round(this.config.barWidthRatio * 100)
    const bg = Math.round(this.config.barGapRatio * 100)
    const cacheKey = `${w}-${this.config.segments}-${m}-${bw}-${bg}`
    const cached = this.cache.barPositions.get(cacheKey)
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
    this.cache.barPositions.set(cacheKey, positions)
    return positions
  }

  /** 预计算圆形角度 */
  private calculateCircularAngles(segments: number) {
    // 获取缓存
    const cached = this.cache.circularAngles.get(segments)
    // 如果缓存存在，则返回
    if (cached)
      return cached

    // 计算角度步长
    const angleStep = (2 * Math.PI) / segments
    // 创建角度数组
    const angles = Array.from({ length: segments }, (_, i) => i * angleStep)

    // 缓存角度数组
    this.cache.circularAngles.set(segments, angles)
    return angles
  }

  /** 创建并缓存背景渐变 */
  private getBackgroundGradient(centerX: number, centerY: number) {
    const cacheKey = `${centerX}-${centerY}`
    const cached = this.cache.backgroundGradient.get(cacheKey)
    if (cached)
      return cached
    // 创建径向渐变背景
    const gradient = this.createRadialGradient(centerX, centerY)
    // 缓存背景渐变
    this.cache.backgroundGradient.set(cacheKey, gradient)
    return gradient
  }

  /** 条形图绘制 */
  private drawBars() {
    // 获取画布中心坐标
    const { centerX, centerY } = this.setupCanvas()
    // 计算条形位置
    const barPositions = this.calculateBarPositions(this.canvas.width)
    // 处理频谱数据
    const interpolatedData = this.processAudioData(this.config.segments)
    if (!interpolatedData)
      return

    // 绘制背景 - 使用缓存的背景渐变
    const bgGradient = this.getBackgroundGradient(centerX, centerY)
    // 设置背景填充样式
    this.ctx.fillStyle = bgGradient
    // 绘制背景
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 计算动态效果
    const { pulseEffect } = this.calculateDynamicEffects(0, 1)
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
        this.drawMonochromeBarGradient(
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
        return this.createGradient(i, amplitude, this.config.segments)
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
        this.setGlowEffect(color, amplitude)
        // 设置填充样式
        this.ctx.fillStyle = barGradient
        // 绘制条形
        this.ctx.fillRect(x, this.canvas.height - barHeight, width, barHeight)
      }
    }

    // 重置发光效果
    this.resetEffects()
  }

  /** 圆形可视化绘制 */
  private drawCircular() {
    // 获取画布中心坐标和基础数据，只计算一次
    const { centerX, centerY } = this.setupCanvas()
    // 计算圆形半径
    const radius = Math.min(centerX, centerY) * this.config.circleRadiusRatio
    // 计算脉冲效果
    const { pulseEffect } = this.calculateDynamicEffects(0, 1)
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
      const glowGradient = this.createDynamicGlow(centerX, centerY, radius)
      // 设置背景填充样式
      this.ctx.fillStyle = glowGradient
      // 绘制背景
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    // 获取预计算的角度数组
    const angles = this.calculateCircularAngles(this.config.segments)

    // 处理鼠标交互
    const mouseInteraction = this.calculateMouseInteraction(centerX, centerY)

    // 处理频谱数据
    const interpolatedData = this.processAudioData(this.config.segments)
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
        // 计算动态效果
        const { heightMultiplier } = this.calculateDynamicEffects(i, this.config.segments)
        // 计算交互倍数
        const interactionMultiplier = this.calculateInteractionMultiplier(angle, mouseInteraction, radius)
        // 计算条形高度
        const barHeight = amplitude * (radius * this.config.circularBarHeightRatio) * heightMultiplier * interactionMultiplier

        // 计算圆形点
        const [x1, y1] = this.getCircularPoint(centerX, centerY, pulseRadius, angle)
        const [x2, y2] = this.getCircularPoint(centerX, centerY, pulseRadius + barHeight, angle)

        // 绘制单色线条
        this.drawMonochromeLineGradient(x1, y1, x2, y2, amplitude, lineWidth)
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
        return this.createGradient(i, amplitude, this.config.segments)
      })

      for (let i = 0; i < this.config.segments; i++) {
        // 计算幅度
        const amplitude = interpolatedData[i] / 255
        // 如果幅度小于0.001，则跳过
        if (amplitude < 0.001)
          continue

        // 计算角度
        const angle = angles[i]
        // 计算动态效果
        const { heightMultiplier } = this.calculateDynamicEffects(i, this.config.segments)
        // 计算交互倍数
        const interactionMultiplier = this.calculateInteractionMultiplier(angle, mouseInteraction, radius)
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
        this.setGlowEffect(color, amplitude)
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
    this.resetEffects()

    // 在重置效果后绘制中心文本
    this.drawCenterText(centerX, centerY, radius)
  }

  /** 设置鼠标事件监听 */
  private setupMouseEvents() {
    // 只有在启用鼠标交互时才添加事件监听
    if (this.config.enableMouseInteraction) {
      // 添加鼠标移动事件监听
      this.canvas.addEventListener('mousemove', (e) => {
        // 获取画布边界矩形
        const rect = this.canvas.getBoundingClientRect()
        // 设置鼠标X坐标
        this.mouseX = (e.clientX - rect.left) * window.devicePixelRatio
        // 设置鼠标Y坐标
        this.mouseY = (e.clientY - rect.top) * window.devicePixelRatio
      })

      // 添加鼠标离开事件监听
      this.canvas.addEventListener('mouseleave', () => {
        // 设置鼠标X坐标
        this.mouseX = undefined
        // 设置鼠标Y坐标
        this.mouseY = undefined
      })
    }
  }

  /** 设置画布尺寸 */
  private setupCanvas() {
    // 如果尺寸没有变化且不是脏状态，直接返回缓存的中心点
    if (!this.canvasSize.dirty
      && this.canvas.width === this.canvasSize.width
      && this.canvas.height === this.canvasSize.height) {
      return {
        centerX: this.canvasSize.centerX,
        centerY: this.canvasSize.centerY,
      }
    }

    const container = this.canvas.parentElement
    // 如果画布容器不存在，返回0
    if (!container)
      return { centerX: 0, centerY: 0 }

    // 确保容器有明确的尺寸
    if (container.clientHeight === 0) {
      container.style.height = '100vh'
    }

    // 获取画布容器宽度
    const containerWidth = container.clientWidth
    // 获取画布容器高度
    const containerHeight = container.clientHeight

    // 设置画布实际尺寸（考虑设备像素比）
    this.canvas.width = containerWidth * window.devicePixelRatio
    // 设置画布实际高度
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

    return {
      centerX: this.canvasSize.centerX,
      centerY: this.canvasSize.centerY,
    }
  }

  /** 创建径向渐变背景 */
  private createRadialGradient(centerX: number, centerY: number) {
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

  /** 创建颜色渐变 */
  private createGradient(i: number, amplitude: number, segments: number) {
    const amp = Math.round(amplitude * 1000)
    const cacheKey = `${i}-${amp}-${segments}`
    const cached = this.cache.gradients.get(cacheKey)
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

    this.cache.gradients.set(cacheKey, gradient)
    return gradient
  }

  /** 设置发光效果 */
  private setGlowEffect(color: string, amplitude: number) {
    // 设置阴影颜色
    this.ctx.shadowColor = color
    // 设置阴影模糊值
    this.ctx.shadowBlur = (this.config.shadowBlur + amplitude * 10) * window.devicePixelRatio
  }

  /** 重置画布效果 */
  private resetEffects() {
    // 设置阴影模糊值
    this.ctx.shadowBlur = 0
    // 设置阴影偏移X
    this.ctx.shadowOffsetX = 0
    // 设置阴影偏移Y
    this.ctx.shadowOffsetY = 0
  }

  /** 处理频谱数据 */
  private processAudioData(segments: number) {
    // 如果频谱数据数组不存在，返回null
    if (!this.dataArray)
      return null
    // 将频谱数据数组转换为数组
    const frequencyData = Array.from(this.dataArray)
    // 插值处理频谱数据
    return this.interpolateArray(frequencyData, segments)
  }

  /** 数据插值方法 */
  private interpolateArray(data: number[], fitCount: number): number[] {
    // 将数据转换为数组
    const normalized = Array.from(data)
    // 创建插值数组
    const interpolated: number[] = []
    // 计算插值因子
    const springFactor = (normalized.length - 1) / (fitCount - 1)
    // 设置插值数组第一个元素
    interpolated[0] = normalized[0]

    for (let i = 1; i < fitCount - 1; i++) {
      // 计算插值因子
      const tmp = i * springFactor
      // 计算插值因子前一个元素
      const before = Math.floor(tmp)
      // 计算插值因子后一个元素
      const after = Math.ceil(tmp)
      // 计算插值因子在两个元素之间的位置
      const atPoint = tmp - before
      // 设置插值数组元素
      interpolated[i] = normalized[before] + (normalized[after] - normalized[before]) * atPoint
    }

    // 设置插值数组最后一个元素
    interpolated[fitCount - 1] = normalized[normalized.length - 1]
    return interpolated
  }

  /** 计算动态效果 */
  private calculateDynamicEffects(i: number, segments: number) {
    const cacheKey = `${i}-${segments}-${Date.now() >> 6}` // 缓存约60ms
    const cached = this.cache.dynamicEffects.get(cacheKey)
    if (cached)
      return cached

    // 创建结果,计算高度倍数 heightMultiplier, 计算脉冲效果 pulseEffect
    const result = {
      heightMultiplier: this.config.heightMultiplier
        + (this.getCachedSin((i / segments) * Math.PI) * this.config.circularIntensityRatio),
      pulseEffect: 1 + this.getCachedSin(Date.now() * this.config.pulseSpeed) * this.config.pulseIntensity,
    }

    this.cache.dynamicEffects.set(cacheKey, result)
    return result
  }

  /** 缓存三角函数计算结果 */
  private getCachedSin(angle: number): number {
    // 计算缓存键
    const key = Math.round(angle * 1000) // 保留三位小数精度
    // 获取缓存
    let value = this.cache.trigCache.sin.get(key)
    // 如果缓存不存在，则计算并缓存
    if (value === undefined) {
      value = Math.sin(angle)
      this.cache.trigCache.sin.set(key, value)
    }
    return value
  }

  private getCachedCos(angle: number): number {
    // 计算缓存键
    const key = Math.round(angle * 1000)
    // 获取缓存
    let value = this.cache.trigCache.cos.get(key)
    // 如果缓存不存在，则计算并缓存
    if (value === undefined) {
      value = Math.cos(angle)
      this.cache.trigCache.cos.set(key, value)
    }
    return value
  }

  /** 创建动态光晕 */
  private createDynamicGlow(centerX: number, centerY: number, radius: number) {
    // 计算时间
    const time = Date.now() * this.config.pulseSpeed
    const cx = Math.round(centerX * 10)
    const cy = Math.round(centerY * 10)
    const r = Math.round(radius * 10)
    const cacheKey = `dynamic-glow-${cx}-${cy}-${r}`
    const cached = this.cache.backgroundGradient.get(cacheKey)
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
    glowGradient.addColorStop(0.5, `rgba(128, 128, 255, ${0.05 + this.getCachedSin(time) * 0.02})`)
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    // 返回动态光晕
    this.cache.backgroundGradient.set(cacheKey, glowGradient)
    return glowGradient
  }

  /** 绘制参考圆环 */
  private drawReferenceCircles(centerX: number, centerY: number, radius: number) {
    // 获取脉冲效果
    const { pulseEffect } = this.calculateDynamicEffects(0, 1)
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
    const cached = this.cache.circularPoints.get(cacheKey)
    if (cached)
      return cached

    // 使用已有的缓存三角函数
    const cos = this.getCachedCos(angle)
    const sin = this.getCachedSin(angle)

    // 计算圆形上的点
    const point: [number, number] = [
      centerX + radius * cos,
      centerY + radius * sin,
    ]

    this.cache.circularPoints.set(cacheKey, point)
    return point
  }

  /** 计算鼠标交互 */
  private calculateMouseInteraction(centerX: number, centerY: number) {
    // 如果鼠标X坐标或Y坐标不存在，返回false
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

  /** 计算交互乘数 */
  private calculateInteractionMultiplier(
    angle: number,
    mouseInteraction: ReturnType<typeof this.calculateMouseInteraction>,
    radius: number,
  ) {
    // 如果未启用鼠标交互或鼠标交互不活跃，返回1
    if (!this.config.enableMouseInteraction || !mouseInteraction.active)
      return 1
    // 计算角度差
    const angleDiff = Math.abs(angle - mouseInteraction.angle)
    // 计算距离效果
    const distanceEffect = Math.max(0, 1 - Math.abs(mouseInteraction.distance - radius) / 100)
    // 返回交互乘数
    return 1 + (angleDiff < 0.5 ? (1 - angleDiff * 2) * distanceEffect : 0)
  }

  /** 配置更新方法 */
  public updateConfig(newConfig: Partial<VisualizerConfig>) {
    const oldEnableMouseInteraction = this.config.enableMouseInteraction
    const { centerText, ...rest } = newConfig
    this.config = {
      ...this.config,
      ...rest,
      centerText: {
        ...this.config.centerText,
        ...centerText,
      },
    }

    // 如果鼠标交互设置发生变化，重新设置事件监听
    if (oldEnableMouseInteraction !== this.config.enableMouseInteraction) {
      // 移除现有的鼠标事件监听器
      this.canvas.removeEventListener('mousemove', () => {})
      this.canvas.removeEventListener('mouseleave', () => {})
      // 重新设置鼠标事件
      this.setupMouseEvents()
    }

    // 在其他可能改变画布尺寸的地方也要标记 dirty
    this.canvasSize.dirty = true
  }

  /** 获取当前配置 */
  public getConfig(): VisualizerConfig {
    return { ...this.config }
  }

  /** 设置可视化模式 */
  setMode(mode: VisualizerMode) {
    this.mode = mode
  }

  /** 定期清理缓存 */
  private cleanCache() {
    if (this.cache.gradients.size > 1000)
      this.cache.gradients.clear()
    if (this.cache.dynamicEffects.size > 1000)
      this.cache.dynamicEffects.clear()
    if (this.cache.circularPoints.size > 2000)
      this.cache.circularPoints.clear()
    if (this.cache.barPositions.size > 10)
      this.cache.barPositions.clear()
    if (this.cache.backgroundGradient.size > 10)
      this.cache.backgroundGradient.clear()
    if (this.cache.trigCache.sin.size > 1000)
      this.cache.trigCache.sin.clear()
    if (this.cache.trigCache.cos.size > 1000)
      this.cache.trigCache.cos.clear()
    if (this.cache.trigCache.atan2.size > 1000)
      this.cache.trigCache.atan2.clear()
  }

  private initMonochromeGradients() {
    // 只创建一次固定的渐变模板
    if (!this.monochromeGradientTemplate.bar) {
      // 条形图渐变模板
      const barGradient = this.ctx.createLinearGradient(0, 0, 1, 0)
      barGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      barGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)')
      barGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
      barGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)')
      barGradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)')
      this.monochromeGradientTemplate.bar = barGradient

      // 线条渐变模板
      const lineGradient = this.ctx.createLinearGradient(0, -0.5, 0, 0.5)
      lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      lineGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)')
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
      lineGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)')
      lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)')
      this.monochromeGradientTemplate.line = lineGradient
    }
  }

  /** 用于条形图的单色渐变效果 */
  private drawMonochromeBarGradient(x: number, y: number, width: number, height: number, amplitude: number) {
    // 设置发光效果
    this.setGlowEffect('rgba(255, 255, 255, 0.9)', amplitude)

    // 使用模板渐变
    if (!this.monochromeGradientTemplate.bar)
      this.initMonochromeGradients()

    // 1. 绘制主体渐变
    this.ctx.fillStyle = this.monochromeGradientTemplate.bar!
    // 通过 transform 来调整渐变位置和大小
    this.ctx.save()
    // 通过 translate 来调整渐变位置
    this.ctx.translate(x, y)
    // 通过 scale 来调整渐变大小
    this.ctx.scale(width, height)
    // 通过 fillRect 来绘制渐变
    this.ctx.fillRect(0, 0, 1, 1)
    // 恢复到原始状态
    this.ctx.restore()

    // 2. 绘制顶部发光效果
    const topGlowHeight = Math.min(height * 0.1, 2)
    // 设置顶部发光效果
    this.ctx.fillStyle = `rgba(255, 255, 255, 0.6)`
    // 通过 fillRect 来绘制顶部发光效果
    this.ctx.fillRect(x, y, width, topGlowHeight)
  }

  /** 用于圆形图的单色渐变效果 */
  private drawMonochromeLineGradient(x1: number, y1: number, x2: number, y2: number, amplitude: number, lineWidth: number) {
    // 设置发光效果
    this.setGlowEffect('rgba(255, 255, 255, 0.9)', amplitude)

    // 使用缓存的 atan2 计算角度
    const angle = this.getCachedAtan2(y2 - y1, x2 - x1)
    // 计算线条长度
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    // 确保模板渐变已初始化
    if (!this.monochromeGradientTemplate.line)
      this.initMonochromeGradients()

    // 绘制主线条
    this.ctx.save()
    // 通过 translate 和 rotate 来调整线条位置和角度
    this.ctx.translate(x1, y1)
    // 通过 rotate 来调整线条角度
    this.ctx.rotate(angle)
    // 通过 scale 来调整线条长度和宽度
    this.ctx.scale(length, lineWidth)
    // 绘制线条
    this.ctx.fillStyle = this.monochromeGradientTemplate.line!
    // 通过 fillRect 来绘制线条
    this.ctx.fillRect(0, -0.5, 1, 1)
    // 恢复到原始状态
    this.ctx.restore()

    // 绘制端点发光效果
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    // 通过 beginPath 和 arc 来绘制端点发光效果
    this.ctx.beginPath()
    this.ctx.arc(x2, y2, lineWidth * 0.2, 0, Math.PI * 2)
    // 通过 fill 来填充端点发光效果
    this.ctx.fill()
  }

  /** 获取缓存的 atan2 值 */
  private getCachedAtan2(y: number, x: number): number {
    const kx = Math.round(x * 1000)
    const ky = Math.round(y * 1000)
    const key = `${kx}-${ky}`
    let value = this.cache.trigCache.atan2.get(key)
    if (value === undefined) {
      value = Math.atan2(y, x)
      this.cache.trigCache.atan2.set(key, value)
    }
    return value
  }

  private drawCenterText(centerX: number, centerY: number, radius: number) {
    const config = this.config.centerText
    if (!config?.enabled)
      return

    // 保存当前状态
    this.ctx.save()
    // 设置文本对齐方式
    this.ctx.textAlign = 'center'
    // 设置文本基线
    this.ctx.textBaseline = 'middle'

    const now = new Date()
    const currentTime = now.getTime()

    // 每分钟更新一次时间和日期字符串
    if (currentTime - this.drawCenterTextCache.lastUpdateTime > 60000) {
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      this.drawCenterTextCache.lastTimeString = `${hours} : ${minutes}`

      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
      this.drawCenterTextCache.lastDateString = `${year} / ${month} / ${day} ${weekday}`

      this.drawCenterTextCache.lastUpdateTime = currentTime
    }

    // 1. 绘制时间
    if (config.time?.enabled) {
      const {
        fontSizeRatio = 0.15,
        offsetYRatio = -0.1,
        color = 'rgba(255, 255, 255, 0.9)',
        fontFamily = 'Monaco',
      } = config.time

      // 计算字体大小和偏移量
      const fontSize = radius * fontSizeRatio
      // 计算偏移量
      const offsetY = radius * offsetYRatio
      // 计算秒数字体大小
      const secondsFontSize = fontSize * 0.5
      // 获取秒数
      const seconds = now.getSeconds().toString().padStart(2, '0')

      // 绘制小时和分钟（大号）
      this.ctx.font = `bold ${fontSize}px ${fontFamily}`
      this.ctx.fillStyle = color
      // 计算时间字符串宽度
      const timeWidth = this.ctx.measureText(this.drawCenterTextCache.lastTimeString).width
      // 绘制时间字符串
      this.ctx.fillText(this.drawCenterTextCache.lastTimeString, centerX - timeWidth * 0.15, centerY + offsetY)

      // 绘制秒数（小号）
      this.ctx.font = `bold ${secondsFontSize}px ${fontFamily}`
      // 通过添加 fontSize * 0.25 来向下偏移秒数，使其底部对齐
      this.ctx.fillText(seconds, centerX + timeWidth * 0.5, centerY + offsetY + fontSize * 0.1)
    }

    // 2. 绘制日期
    if (config.date?.enabled) {
      const {
        fontSizeRatio = 0.08,
        offsetYRatio = 0.1,
        color = 'rgba(255, 255, 255, 0.7)',
        fontFamily = 'Arial',
      } = config.date

      // 计算字体大小和偏移量
      const fontSize = radius * fontSizeRatio
      const offsetY = radius * offsetYRatio

      // 设置字体
      this.ctx.font = `${fontSize}px ${fontFamily}`
      // 设置文本颜色
      this.ctx.fillStyle = color
      // 绘制日期字符串
      this.ctx.fillText(this.drawCenterTextCache.lastDateString, centerX, centerY + offsetY)
    }

    // 3. 绘制自定义文本
    if (config.custom?.enabled) {
      const {
        fontSizeRatio = 0.1,
        offsetYRatio = 0.3,
        color = 'rgba(255, 255, 255, 0.8)',
        fontFamily = 'Arial',
        text,
        animation = {
          type: 'fade' as const,
          duration: 500,
        },
      } = config.custom

      this.drawCustomText(centerX, centerY, radius, {
        enabled: true,
        text,
        fontSizeRatio,
        offsetYRatio,
        color,
        fontFamily,
        animation,
      })
    }

    // 恢复到原始状态
    this.ctx.restore()
  }

  private drawCustomText(
    centerX: number,
    centerY: number,
    radius: number,
    config: NonNullable<Required<CenterTextConfig['custom']>>,
  ) {
    // 计算字体大小
    const fontSize = radius * config.fontSizeRatio
    // 计算偏移量
    const offsetY = radius * config.offsetYRatio

    // 设置字体
    this.ctx.font = `${fontSize}px ${config.fontFamily}`
    // 设置文本颜色
    this.ctx.fillStyle = config.color

    // 如果文本发生变化，则记录文本和动画开始时间
    if (this.drawCenterTextCache.lastCustomText !== config.text) {
      // 记录文本
      this.drawCenterTextCache.lastCustomText = config.text
      // 记录动画开始时间
      this.drawCenterTextCache.customTextAnimationStart = Date.now()
    }

    // 计算动画进度
    const animationProgress = Math.min(
      (Date.now() - this.drawCenterTextCache.customTextAnimationStart) / (config.animation.duration ?? 500),
      1,
    )

    switch (config.animation.type) {
      case 'fade': {
        // 设置透明度
        this.ctx.globalAlpha = animationProgress
        // 绘制文本
        this.ctx.fillText(config.text, centerX, centerY + offsetY)
        break
      }

      case 'slide': {
        // 计算偏移量
        const slideOffset = (1 - animationProgress) * radius * 0.5
        // 绘制文本
        this.ctx.fillText(
          config.text,
          centerX,
          centerY + offsetY + slideOffset,
        )
        break
      }

      case 'none':
      default: {
        // 绘制文本
        this.ctx.fillText(config.text, centerX, centerY + offsetY)
        break
      }
    }

    // 重置透明度
    this.ctx.globalAlpha = 1
  }
}
