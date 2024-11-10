import type { CenterTextConfig } from './audioTypes'

/** 时间、日期、自定义文本渲染器 */
export class CenterTextRenderer {
  private cache = {
    lastTimeString: '',
    lastDateString: '',
    lastUpdateTime: 0,
    lastCustomText: '',
    customTextAnimationStart: 0,
  }

  constructor(private ctx: CanvasRenderingContext2D) {}

  /** 绘制中心文本 */
  drawCenterText(centerX: number, centerY: number, radius: number, config: CenterTextConfig) {
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
    if (currentTime - this.cache.lastUpdateTime > 60000) {
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      this.cache.lastTimeString = `${hours} : ${minutes}`

      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
      this.cache.lastDateString = `${year} / ${month} / ${day} ${weekday}`

      this.cache.lastUpdateTime = currentTime
    }

    if (config.time?.enabled) {
      this.drawTimeText(
        centerX,
        centerY,
        radius,
        now,
        config.time as NonNullable<Required<CenterTextConfig['time']>>,
      )
    }

    if (config.date?.enabled) {
      this.drawDateText(
        centerX,
        centerY,
        radius,
        config.date as NonNullable<Required<CenterTextConfig['date']>>,
      )
    }

    if (config.custom?.enabled) {
      this.drawCustomText(
        centerX,
        centerY,
        radius,
        config.custom as NonNullable<Required<CenterTextConfig['custom']>>,
      )
    }

    // 恢复到原始状态
    this.ctx.restore()
  }

  /** 绘制时间文本 */
  private drawTimeText(
    centerX: number,
    centerY: number,
    radius: number,
    now: Date,
    config: NonNullable<Required<CenterTextConfig['time']>>,
  ) {
    const {
      fontSizeRatio = 0.15,
      offsetYRatio = -0.1,
      color = 'rgba(255, 255, 255, 0.9)',
      fontFamily = 'Monaco',
    } = config

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
    const timeWidth = this.ctx.measureText(this.cache.lastTimeString).width
    // 绘制时间字符串
    this.ctx.fillText(this.cache.lastTimeString, centerX - timeWidth * 0.15, centerY + offsetY)

    // 绘制秒数（小号）
    this.ctx.font = `bold ${secondsFontSize}px ${fontFamily}`
    // 通过添加 fontSize * 0.25 来向下偏移秒数，使其底部对齐
    this.ctx.fillText(seconds, centerX + timeWidth * 0.5, centerY + offsetY + fontSize * 0.1)
  }

  /** 绘制日期文本 */
  private drawDateText(
    centerX: number,
    centerY: number,
    radius: number,
    config: NonNullable<Required<CenterTextConfig['date']>>,
  ) {
    const {
      fontSizeRatio = 0.08,
      offsetYRatio = 0.1,
      color = 'rgba(255, 255, 255, 0.7)',
      fontFamily = 'Arial',
    } = config

    // 计算字体大小和偏移量
    const fontSize = radius * fontSizeRatio
    const offsetY = radius * offsetYRatio

    // 设置字体
    this.ctx.font = `${fontSize}px ${fontFamily}`
    // 设置文本颜色
    this.ctx.fillStyle = color
    // 绘制日期字符串
    this.ctx.fillText(this.cache.lastDateString, centerX, centerY + offsetY)
  }

  /** 绘制自定义文本 */
  private drawCustomText(
    centerX: number,
    centerY: number,
    radius: number,
    config: NonNullable<Required<CenterTextConfig['custom']>>,
  ) {
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
    } = config
    // 计算字体大小
    const fontSize = radius * fontSizeRatio
    // 计算偏移量
    const offsetY = radius * offsetYRatio

    // 设置字体
    this.ctx.font = `${fontSize}px ${fontFamily}`
    // 设置文本颜色
    this.ctx.fillStyle = color

    // 如果文本发生变化，则记录文本和动画开始时间
    if (this.cache.lastCustomText !== text) {
      // 记录文本
      this.cache.lastCustomText = text
      // 记录动画开始时间
      this.cache.customTextAnimationStart = Date.now()
    }

    // 计算动画进度
    const animationProgress = Math.min(
      (Date.now() - this.cache.customTextAnimationStart) / (animation.duration ?? 500),
      1,
    )

    switch (animation.type) {
      case 'fade': {
        // 设置透明度
        this.ctx.globalAlpha = animationProgress
        // 绘制文本
        this.ctx.fillText(text, centerX, centerY + offsetY)
        break
      }

      case 'slide': {
        // 计算偏移量
        const slideOffset = (1 - animationProgress) * radius * 0.5
        // 绘制文本
        this.ctx.fillText(
          text,
          centerX,
          centerY + offsetY + slideOffset,
        )
        break
      }

      case 'none':
      default: {
        // 绘制文本
        this.ctx.fillText(text, centerX, centerY + offsetY)
        break
      }
    }

    // 重置透明度
    this.ctx.globalAlpha = 1
  }
}
