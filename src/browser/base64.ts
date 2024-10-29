/**
 * 将图片转换为 Base64 编码
 * @param file 图片文件
 * @returns Base64 编码
 */
export async function imageToBase64Browser(file: File | Blob): Promise<string> {
  const reader = new FileReader()

  return new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data) // 返回 Base64 数据 URL
    }
    reader.onerror = reject
    reader.readAsDataURL(file) // 读取 File 或 Blob
  })
}
