interface UsageDetails {
  /** IndexedDB 使用量 */
  indexedDB?: number
  /** LocalStorage 使用量 */
  localStorage?: number
  /** Cache Storage 使用量 */
  caches?: number
}

interface ExtendedStorageEstimate extends StorageEstimate {
  usageDetails?: UsageDetails
}

interface StorageInfo {
  /** 存储配额 */
  quota: number
  /** 已使用量 */
  usage: number
  /** 详细使用情况 */
  usageDetails?: UsageDetails
}

/** 获取存储信息 */
export async function getStorageInfo(): Promise<StorageInfo> {
  try {
    const estimate = await navigator.storage.estimate() as ExtendedStorageEstimate

    const storageInfo: StorageInfo = {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0,
    }

    if (estimate.usageDetails) {
      storageInfo.usageDetails = {
        indexedDB: estimate.usageDetails.indexedDB,
        localStorage: estimate.usageDetails.localStorage,
        caches: estimate.usageDetails.caches,
      }
    }

    return storageInfo
  }
  catch (error) {
    console.error('获取存储信息失败:', error)
    throw error
  }
}

/**
 * 获取指定存储类型的使用量
 * @param storageType - 存储类型
 * @returns 使用量（字节）
 */
export async function getStorageUsage(storageType: keyof UsageDetails): Promise<number> {
  const info = await getStorageInfo()
  return info.usageDetails?.[storageType] || 0
}

/**
 * 监控存储使用情况
 * @param callback - 存储变化时的回调函数
 * @param interval - 检查间隔（毫秒），默认 5000ms
 * @returns 停止监控的函数
 */
export function watchStorage(
  callback: (info: StorageInfo) => void,
  interval = 5000,
): () => void {
  let lastUsage: string = ''
  const timer = setInterval(async () => {
    const info = await getStorageInfo()
    const currentUsage = JSON.stringify(info.usageDetails)

    if (currentUsage !== lastUsage) {
      lastUsage = currentUsage
      callback(info)
    }
  }, interval)

  return () => clearInterval(timer)
}

/** 清理 IndexedDB */
export async function clearIndexedDB(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 清理 LocalStorage */
export function clearLocalStorage(): void {
  try {
    localStorage.clear()
  }
  catch (error) {
    console.error('清理 LocalStorage 失败:', error)
    throw error
  }
}

/** 清理 Cache Storage */
export async function clearCaches(): Promise<void> {
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map(key => caches.delete(key)))
  }
  catch (error) {
    console.error('清理 Cache Storage 失败:', error)
    throw error
  }
}

/**
 * 清理所有存储
 * @param dbNames - 数据库名称列表
 */
export async function clearAll(dbNames: string[]): Promise<void> {
  try {
    await Promise.all(dbNames.map(clearIndexedDB))
    clearLocalStorage()
    await clearCaches()
  }
  catch (error) {
    console.error('清理所有存储失败:', error)
    throw error
  }
}
