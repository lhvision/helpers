/**
 * 将文件转换为 Base64 编码
 * @param file 文件对象(File 或 Blob)
 * @returns Base64 编码字符串
 */
export async function fileToBase64Browser(file: File | Blob): Promise<string> {
  const reader = new FileReader()

  return new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
