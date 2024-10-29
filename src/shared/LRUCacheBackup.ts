/**
 * 双向链表的节点类，每个节点包含键、值以及指向前驱和后继节点的引用。
 */
class DLinkedNode<K, V> {
  key: K
  value: V
  prev: DLinkedNode<K, V> | null
  next: DLinkedNode<K, V> | null

  constructor(key?: K, value?: V) {
    this.key = key as K
    this.value = value as V
    this.prev = null
    this.next = null
  }
}

export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, DLinkedNode<K, V>>
  private head: DLinkedNode<K, V>
  private tail: DLinkedNode<K, V>

  /**
   * 创建一个LRU缓存实例
   * @param capacity 缓存容量
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive number')
    }

    this.capacity = capacity
    this.cache = new Map<K, DLinkedNode<K, V>>()

    // 初始化虚拟头部和尾部节点
    this.head = new DLinkedNode<K, V>()
    this.tail = new DLinkedNode<K, V>()
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  /**
   * 获取指定键的值，如果存在则将该节点移动到头部
   * @param key 键
   * @returns 值或 undefined
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key)
    if (!node) {
      return undefined
    }
    this.moveToHead(node)
    return node.value
  }

  /**
   * 设置键值对，如果键已存在则更新值并移动到头部；如果键不存在则添加新节点
   * @param key 键
   * @param value 值
   */
  put(key: K, value: V): void {
    const node = this.cache.get(key)
    if (node) {
      node.value = value
      this.moveToHead(node)
    }
    else {
      const newNode = new DLinkedNode<K, V>(key, value)
      this.cache.set(key, newNode)
      this.addToHead(newNode)

      if (this.cache.size > this.capacity) {
        const tail = this.removeTail()
        if (tail) {
          this.cache.delete(tail.key)
        }
      }
    }
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
   * 移除缓存中的所有项
   */
  clear(): void {
    this.cache.clear()
    this.head.next = this.tail
    this.tail.prev = this.head
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
      const tail = this.removeTail()
      if (tail) {
        this.cache.delete(tail.key)
      }
    }
  }

  /**
   * 将节点添加到链表头部
   * @param node 节点
   */
  private addToHead(node: DLinkedNode<K, V>): void {
    node.prev = this.head
    node.next = this.head.next
    if (this.head.next) {
      this.head.next.prev = node
    }
    this.head.next = node
  }

  /**
   * 从链表中移除指定节点
   * @param node 节点
   */
  private removeNode(node: DLinkedNode<K, V>): void {
    const prev = node.prev
    const next = node.next
    if (prev) {
      prev.next = next
    }
    if (next) {
      next.prev = prev
    }
  }

  /**
   * 将指定节点移动到链表头部
   * @param node 节点
   */
  private moveToHead(node: DLinkedNode<K, V>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 移除链表尾部节点并返回该节点
   * @returns 尾部节点或 null
   */
  private removeTail(): DLinkedNode<K, V> | null {
    const node = this.tail.prev
    if (node && node !== this.head) {
      this.removeNode(node)
      return node
    }
    return null
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
