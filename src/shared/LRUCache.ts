export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  /**
   * 创建一个 LRU 缓存实例，尾部为最近使用、头部为最少使用
   * @param capacity 缓存容量
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive number')
    }

    this.capacity = capacity
    this.cache = new Map<K, V>()
  }

  /**
   * 检查缓存中是否存在指定键
   * @param key 键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * 获取指定键的值，如果存在则将该节点移动到尾部
   * @param key 键
   * @returns 值或 undefined
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (!value) {
      return undefined
    }
    this.moveToTail(key, value)
    return value
  }

  /**
   * 设置键值对，如果键已存在则更新值并移动到尾部；如果键不存在则添加新节点
   * @param key 键
   * @param value 值
   */
  put(key: K, value: V): void {
    if (this.has(key)) {
      this.cache.delete(key)
    }
    this.cache.set(key, value)
    if (this.cache.size > this.capacity) {
      this.removeOldestEntry()
    }
  }

  /**
   * 移除缓存中的所有项
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取当前缓存的大小
   * @returns 缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 获取缓存容量
   * @returns 缓存容量
   */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * 设置新的缓存容量，并根据需要移除多余的节点
   * @param newCapacity 新的容量
   */
  setCapacity(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new Error('Capacity must be a positive number')
    }
    this.capacity = newCapacity
    while (this.cache.size > this.capacity) {
      this.removeOldestEntry()
    }
  }

  /**
   * 将指定键值对移动到缓存的尾部，表示最近使用
   * @param key 键
   * @param value 值
   */
  private moveToTail(key: K, value: V): void {
    this.cache.delete(key)
    this.cache.set(key, value)
  }

  /**
   * 移除缓存中的最旧的节点，表示最少使用
   */
  private removeOldestEntry(): void {
    const oldestKey = this.cache.keys().next().value
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

type LoadFunction<K, V> = (key: K) => Promise<V>

export class AsyncLRUCache<K, V> extends LRUCache<K, V> {
  private loadFunction: LoadFunction<K, V>
  private loadingPromises: Map<K, Promise<V>>

  /**
   * 创建一个支持异步加载的LRU缓存实例
   * @param capacity 缓存容量
   * @param loadFunction 缓存未命中时用于加载数据的函数
   */
  constructor(capacity: number, loadFunction: LoadFunction<K, V>) {
    super(capacity)
    this.loadFunction = loadFunction
    this.loadingPromises = new Map<K, Promise<V>>()
  }

  /**
   * 异步获取指定键的值
   * @param key 键
   * @returns 包含值的Promise
   */
  async getAsync(key: K): Promise<V> {
    const cachedValue = this.get(key)
    if (cachedValue !== undefined) {
      return Promise.resolve(cachedValue)
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!
    }

    const loadPromise = this.loadFunction(key)
      .then((value) => {
        this.put(key, value)
        this.loadingPromises.delete(key)
        return value
      })
      .catch((err) => {
        this.loadingPromises.delete(key)
        throw err
      })

    this.loadingPromises.set(key, loadPromise)
    return loadPromise
  }
}
