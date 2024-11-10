export class MonochromeRenderer {
  private monochromeGradientTemplate = {
    bar: null as CanvasGradient | null,
    line: null as CanvasGradient | null,
  }

  constructor(private ctx: CanvasRenderingContext2D) {}

  /** 初始化单色渐变模板 */
  private initMonochromeGradients() {
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

  /** 设置发光效果 */
  private setGlowEffect(amplitude: number) {
    // 设置阴影颜色
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)'
    // 设置阴影模糊值
    this.ctx.shadowBlur = (15 + amplitude * 10) * window.devicePixelRatio
  }

  /** 用于条形图的单色渐变效果 */
  drawMonochromeBarGradient(x: number, y: number, width: number, height: number, amplitude: number) {
    // 确保模板渐变已初始化
    if (!this.monochromeGradientTemplate.bar)
      this.initMonochromeGradients()

    // 设置发光效果
    this.setGlowEffect(amplitude)

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
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    //  通过 fillRect 来绘制顶部发光效果
    this.ctx.fillRect(x, y, width, topGlowHeight)
  }

  /** 用于圆形图的单色渐变效果 */
  drawMonochromeLineGradient(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    amplitude: number,
    lineWidth: number,
    angle: number,
  ) {
    // 确保模板渐变已初始化
    if (!this.monochromeGradientTemplate.line)
      this.initMonochromeGradients()

    // 设置发光效果
    this.setGlowEffect(amplitude)

    // 计算线条长度
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

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
}
