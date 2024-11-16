/**
 * 粘贴图片
 * @param el 元素
 * @param onPaste 粘贴事件回调
 * @param onError 错误回调
 * @returns 清理函数
 */
export function pasteImage(el: HTMLElement, onPaste: (base64: string) => void, onError?: (e: Error) => void) {
  const pasteHandler = (e: ClipboardEvent) => {
    if (e.clipboardData?.files.length) {
      e.preventDefault()
      const file = e.clipboardData.files[0]
      // 验证是否为图片文件
      if (!file.type.startsWith('image/')) {
        return
      }

      const fileReader = new FileReader()
      fileReader.onload = (e) => {
        const base64 = e.target?.result as string
        onPaste(base64)
      }
      // 错误处理
      fileReader.onerror = (e: any) => {
        onError?.(e)
      }

      fileReader.readAsDataURL(file)
    }
  }

  el.addEventListener('paste', pasteHandler)

  return () => el.removeEventListener('paste', pasteHandler)
}

/**
 * 读取剪贴板文本
 * @returns 剪贴板文本
 */
export function readText() {
  return navigator.clipboard.readText()
}

/**
 * 复制文本
 * @param text 文本
 * @returns 是否成功
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    return false
  }
}

// type CopyFunction = (text: string) => Promise<boolean>

// function createModernCopy(): CopyFunction {
//   return async (text: string) => {
//     await navigator.clipboard.writeText(text)
//     return true
//   }
// }

// function createLegacyCopy(): CopyFunction {
//   return async (text: string) => {
//     const textarea = document.createElement('textarea')
//     textarea.value = text
//     textarea.style.position = 'fixed'
//     textarea.style.opacity = '0'
//     document.body.appendChild(textarea)
//     textarea.select()
//     const result = document.execCommand('copy')
//     document.body.removeChild(textarea)
//     return result
//   }
// }

// let copyImpl: CopyFunction | null = null
