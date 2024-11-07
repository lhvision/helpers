/**
 * 获取颜色选择器中的颜色
 * @returns 包含十六进制、RGB、HSL 和 HSV 值的对象
 */
export async function getEyeDropperColor() {
  if (!('EyeDropper' in window)) {
    throw new Error('EyeDropper API is not supported in this browser.')
  }

  const eyeDropper = new (window as any).EyeDropper()
  try {
    const result = await eyeDropper.open()
    const hex = result.sRGBHex as string
    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb)
    const hsv = rgbToHsv(rgb)

    return { hex, rgb, hsl, hsv }
  }
  catch (error) {
    console.error('Error using EyeDropper:', error)
    throw error
  }
}

/**
 * 将十六进制颜色转换为 RGB 颜色
 * @param hex - 十六进制颜色字符串
 * @returns 包含 RGB 值的对象
 */
export function hexToRgb(hex: string) {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    throw new Error('Invalid hex format')
  }
  const bigint = Number.parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

/**
 * 将 RGB 颜色转换为 HSL 颜色
 * @param rgb - 包含 RGB 值的对象
 * @returns 包含 HSL 值的对象
 */
export function rgbToHsl({ r, g, b }: { r: number, g: number, b: number }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: {
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      }
      case g: {
        h = (b - r) / d + 2
        break
      }
      case b: {
        h = (r - g) / d + 4
        break
      }
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * 将 RGB 颜色转换为 HSV 颜色
 * @param rgb - 包含 RGB 值的对象
 * @returns 包含 HSV 值的对象
 */
export function rgbToHsv({ r, g, b }: { r: number, g: number, b: number }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max
  let h = 0

  if (max !== min) {
    switch (max) {
      case r: {
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      }
      case g: {
        h = (b - r) / d + 2
        break
      }
      case b: {
        h = (r - g) / d + 4
        break
      }
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, v: v * 100 }
}
