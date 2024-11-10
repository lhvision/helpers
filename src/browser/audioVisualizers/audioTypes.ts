export type VisualizerMode = 'bar' | 'circular'

export interface VisualizerConfig {
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

export interface AnimationConfig {
  /** 是否正在动画 */
  isAnimating: boolean
  /** 最后一帧时间 */
  lastFrameTime: number
  /**
   * 目标帧率
   * 单位：帧/秒
   * @defaultValue 60
   */
  TARGET_FPS: number
  /**
   * 帧间隔
   * 单位：毫秒
   * @defaultValue 1000 / 60
   */
  FRAME_INTERVAL: number
  /**
   * 空闲回调超时时间
   * 单位：毫秒
   * @defaultValue 50
   */
  IDLE_TIMEOUT: number
}

export interface CacheStore {
  /** 渐变 */
  gradients: Map<string, {
    color: string
    gradient: string[]
  }>
  /** 脉冲效果 */
  pulseEffects: Map<string, number>
  /** 高度乘数 */
  heightMultipliers: Map<string, number>
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

export interface CenterTextConfig {
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

export interface MouseInteraction {
  /** 角度 */
  angle: number
  /** 距离 */
  distance: number
  /** 是否活跃 */
  active: boolean
}
