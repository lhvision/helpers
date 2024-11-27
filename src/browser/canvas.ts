/**
 * 将 Canvas 转换为高清图片
 * @param canvas 要转换的 canvas 元素
 * @param type 图片类型，默认为 'image/png'
 * @param quality 图片质量，仅对 'image/jpeg' 或 'image/webp' 有效，取值范围 0-1，默认为 0.92
 * @returns 图片的 Data URL
 */
export function canvasToImage(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.92,
): string {
  // 创建临时 canvas
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!

  // 获取设备像素比
  const dpr = window.devicePixelRatio || 1

  // 设置临时 canvas 尺寸
  tempCanvas.width = canvas.width * dpr
  // 设置临时 canvas 高度
  tempCanvas.height = canvas.height * dpr

  // 启用图像平滑
  tempCtx.imageSmoothingEnabled = true
  // 设置图像平滑质量
  tempCtx.imageSmoothingQuality = 'high'

  // 缩放以适应设备像素比
  tempCtx.scale(dpr, dpr)

  // 绘制原始 canvas 内容
  tempCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  // 转换为图片
  return tempCanvas.toDataURL(type, quality)
}
