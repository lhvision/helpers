/**
 * 将文件转换为 Base64 编码
 * @param file 文件对象(File 或 Blob)
 * @returns Base64 编码字符串
 */
export function fileToBase64Browser(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data)
    }

    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}
