interface FileSystemOptions {
  /** 允许选择的文件类型的数组。每个项目都是一个具有以下选项的对象： */
  types?: {
    /** 允许的文件类型类别的可选描述。默认为空字符串。 */
    description?: string
    /** 其键设置为 MIME 类型，值设置为文件扩展名的数组 */
    accept: Record<string, string[]>
  }[]
  /**
   * 默认情况下，选择器应包含一个不应用任何文件类型过滤器的选项（通过下面的类型选项启动）。
   * 将此选项设置为 true 意味着该选项不可用。
   * @defaultValue false
   */
  excludeAcceptAllOption?: boolean
  /** 通过指定 ID，浏览器可以为不同的 ID 记住不同的目录。如果相同的 ID 用于另一个选择器，则该选择器将在同一目录中打开。 */
  id?: string
  /**
   * 一个 FileSystemHandle 对象或一个众所周知的目录
   * （"desktop"、"documents"、"downloads"、"music"、"pictures" 或 "videos"）以指定打开选择器的起始目录。
   */
  startIn?: FileSystemHandle | string
}

interface SaveFileOptions extends FileSystemOptions {
  /** 建议的文件名。 */
  suggestedName?: string
}

interface OpenFileOptions extends FileSystemOptions {
  /**
   * 是否允许多选。
   * @defaultValue false
   */
  multiple?: boolean
}

/**
 * 保存文件到磁盘
 * @param content - 文件内容
 * @param options - 文件选择器选项
 * @returns 是否保存成功
 */
export async function saveFileInBrowser(content: string, options?: SaveFileOptions) {
  if (!('showSaveFilePicker' in window)) {
    throw new Error('showSaveFilePicker is not supported in this browser.')
  }

  try {
    // 配置文件选择器选项
    const opts = {
      ...options,
      types: options?.types || [{
        description: '文本文件',
        accept: {
          'text/plain': ['.txt'],
        },
      }],
    }

    // 打开文件保存对话框
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showSaveFilePicker
    const handle = await (window as any).showSaveFilePicker(opts)

    // 创建可写流
    const writable = await handle.createWritable()

    // 写入内容
    await writable.write(content)

    // 关闭流
    await writable.close()

    return true
  }
  catch (error) {
    console.error('Failed to save file in browser:', error)
    throw error
  }
}

/**
 * 从磁盘读取文件
 * @param options - 文件选择器选项
 * @returns 文件内容
 */
export async function openFileInBrowser<T = any>(options?: OpenFileOptions): Promise<T> {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('showOpenFilePicker is not supported in this browser.')
  }

  try {
    // 配置文件选择器选项
    const opts = {
      ...options,
      types: options?.types || [{
        description: '文本文件',
        accept: {
          'text/plain': ['.txt'],
        },
      }],
      multiple: false, // 是否允许多选
    }

    // 打开文件选择对话框
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showOpenFilePicker
    const [handle] = await (window as any).showOpenFilePicker(opts)

    // 获取文件
    const file = await handle.getFile()

    // 读取文件内容
    const content = await file.text()

    return content
  }
  catch (error) {
    console.error('Failed to open file in browser:', error)
    throw error
  }
}
