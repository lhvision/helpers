type PasteErrorType = 'READ_ERROR' | 'INVALID_TYPE' | 'NO_FILE'

class PasteError extends Error {
  constructor(message: string, public type: PasteErrorType) {
    super(message)
    this.name = 'PasteError'
  }
}

/**
 * 粘贴图片
 * @param onPaste 粘贴事件回调
 * @param onError 错误回调
 * @returns 粘贴事件处理函数
 */
export function pasteImage(
  onPaste: (base64: string) => void,
  onError?: (error: PasteError) => void,
) {
  return async (e: ClipboardEvent) => {
    try {
      if (!e.clipboardData?.files.length) {
        throw new PasteError('No file found in clipboard', 'NO_FILE')
      }

      e.preventDefault()
      const file = e.clipboardData.files[0]

      if (!file.type.startsWith('image/')) {
        throw new PasteError('Invalid file type. Only images are allowed', 'INVALID_TYPE')
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          if (!e.target?.result) {
            reject(new PasteError('Failed to read file content', 'READ_ERROR'))
            return
          }
          resolve(e.target.result as string)
        }

        reader.onerror = () => {
          reject(new PasteError('Error occurred while reading file', 'READ_ERROR'))
        }

        reader.readAsDataURL(file)
      })

      onPaste(base64)
    }
    catch (error) {
      onError?.(
        error instanceof PasteError
          ? error
          : new PasteError('Unexpected error occurred', 'READ_ERROR'),
      )
    }
  }
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
