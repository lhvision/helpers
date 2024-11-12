// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { fileToBase64Browser } from '../base64'

describe('imageToBase64Browser', () => {
  it('should convert a Blob to Base64 string', async () => {
    // 创建一个简单的 Blob 对象
    const blob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" style="fill:blue"/></svg>'], { type: 'image/svg+xml' })

    const base64Image = await fileToBase64Browser(blob)

    // 检查返回的字符串是否包含 'data:image/svg+xml;base64,'
    expect(base64Image).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('should convert a File to Base64 string', async () => {
    // 创建一个 File 对象
    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" style="fill:red"/></svg>'], 'test.svg', { type: 'image/svg+xml' })

    const base64Image = await fileToBase64Browser(file)

    // 检查返回的字符串是否包含 'data:image/svg+xml;base64,'
    expect(base64Image).toMatch(/^data:image\/svg\+xml;base64,/)
  })
})
