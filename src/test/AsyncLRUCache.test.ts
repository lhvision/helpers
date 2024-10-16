import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AsyncLRUCache } from '../shared/LRUCache'

interface TestData {
  value: string
}

/**
 * 辅助函数：模拟异步加载函数
 * @param delay  模拟网络延迟
 * @param failKeys 一组在加载时会抛出错误的键
 * @returns 一个被 Vitest 监控的 mock 函数
 */
function createLoadFunction(delay: number = 50, failKeys: Set<any> = new Set()) {
  return vi.fn(async (key: any): Promise<TestData> => {
    await new Promise(resolve => setTimeout(resolve, delay))
    if (failKeys.has(key)) {
      throw new Error(`Failed to load key: ${key}`)
    }
    return { value: `Value for ${key}` }
  })
}

describe('asyncLRUCache', () => {
  let loadFunction: ReturnType<typeof createLoadFunction>
  let cache: AsyncLRUCache<string, TestData>

  // 在每个测试用例前，重置 loadFunction 和 cache 实例，确保测试之间互不干扰。
  beforeEach(() => {
    loadFunction = createLoadFunction()
    cache = new AsyncLRUCache<string, TestData>(3, loadFunction)
  })

  // 初始化测试：验证缓存初始化时大小和容量是否正确
  it('should initialize correctly', () => {
    expect(cache.size()).toBe(0)
    expect(cache.getCapacity()).toBe(3)
  })

  // 缓存未命中时加载并缓存值：当缓存未命中时，确保 loadFunction 被调用并且值被缓存
  it('should load and cache a value on cache miss', async () => {
    const key = 'key1'
    const result = await cache.getAsync(key)

    expect(loadFunction).toHaveBeenCalledTimes(1)
    expect(loadFunction).toHaveBeenCalledWith(key)
    expect(result).toEqual({ value: `Value for ${key}` })
    expect(cache.size()).toBe(1)
    expect(cache.get(key)).toEqual({ value: `Value for ${key}` })
  })

  // 缓存命中时返回缓存值且不调用 loadFunction：确保在缓存命中时，loadFunction 不会被再次调用。
  it('should return cached value on cache hit without calling loadFunction', async () => {
    const key = 'key2'
    // First call to load and cache the value
    const firstResult = await cache.getAsync(key)
    // Reset mock call count
    loadFunction.mockClear()
    // Second call should return cached value
    const secondResult = await cache.getAsync(key)

    expect(loadFunction).not.toHaveBeenCalled()
    expect(secondResult).toEqual(firstResult)
    expect(cache.size()).toBe(1)
  })

  // 避免重复加载：测试多个同时请求相同键时，仅调用一次 loadFunction。
  it('should avoid duplicate loadFunction calls for concurrent getAsync calls', async () => {
    const key = 'key3'
    const concurrentCalls = 5

    const promises = Array.from({ length: concurrentCalls }, () => cache.getAsync(key))

    const results = await Promise.all(promises)

    expect(loadFunction).toHaveBeenCalledTimes(1)
    results.forEach((result) => {
      expect(result).toEqual({ value: `Value for ${key}` })
    })
    expect(cache.size()).toBe(1)
  })

  // 错误处理：确保当 loadFunction 抛出错误时，错误被正确传播，并且缓存不包含该键。
  it('should handle loadFunction errors correctly', async () => {
    const failingKey = 'failKey'
    loadFunction = createLoadFunction(50, new Set([failingKey]))
    cache = new AsyncLRUCache<string, TestData>(3, loadFunction)

    await expect(cache.getAsync(failingKey)).rejects.toThrow(`Failed to load key: ${failingKey}`)
    expect(loadFunction).toHaveBeenCalledTimes(1)
    expect(cache.size()).toBe(0) // Should not cache failed loads
    expect(cache.get(failingKey)).toBeUndefined()
  })

  // 容量限制：测试当缓存容量被超过时，最少使用的项被正确移除。
  it('should evict least recently used item when capacity is exceeded', async () => {
    const keys = ['keyA', 'keyB', 'keyC', 'keyD']

    // Load first three keys
    await cache.getAsync(keys[0]) // keyA
    await cache.getAsync(keys[1]) // keyB
    await cache.getAsync(keys[2]) // keyC

    expect(cache.size()).toBe(3)
    expect(cache.get(keys[0])).toBeDefined()
    expect(cache.get(keys[1])).toBeDefined()
    expect(cache.get(keys[2])).toBeDefined()

    // Access keyA to make it recently used
    await cache.getAsync(keys[0])

    // Load keyD, should evict keyB
    await cache.getAsync(keys[3])

    expect(cache.size()).toBe(3)
    expect(cache.get(keys[0])).toBeDefined() // keyA
    expect(cache.get(keys[1])).toBeUndefined() // keyB evicted
    expect(cache.get(keys[2])).toBeDefined() // keyC
    expect(cache.get(keys[3])).toBeDefined() // keyD
  })

  // 容量变化：验证在增加缓存容量时，缓存行为是否正确。
  it('should update cache when capacity is increased', async () => {
    const keys = ['key1', 'key2', 'key3', 'key4']

    // Load three keys
    await cache.getAsync(keys[0])
    await cache.getAsync(keys[1])
    await cache.getAsync(keys[2])

    expect(cache.size()).toBe(3)

    // Increase capacity
    cache.setCapacity(4)

    // Load fourth key
    await cache.getAsync(keys[3])

    expect(cache.size()).toBe(4)
    keys.forEach((key) => {
      expect(cache.get(key)).toBeDefined()
    })
  })

  // 容量减少：测试在减少缓存容量时，正确移除最少使用的项。
  it('should evict items correctly when capacity is decreased', async () => {
    const keys = ['keyX', 'keyY', 'keyZ']

    // Load three keys
    await cache.getAsync(keys[0]) // keyX
    await cache.getAsync(keys[1]) // keyY
    await cache.getAsync(keys[2]) // keyZ

    expect(cache.size()).toBe(3)

    // Decrease capacity to 2
    cache.setCapacity(2)

    expect(cache.size()).toBe(2)
    // keyX was least recently used and should be evicted
    expect(cache.get(keys[0])).toBeUndefined()
    expect(cache.get(keys[1])).toBeDefined()
    expect(cache.get(keys[2])).toBeDefined()
  })

  // 清空缓存：确保 clear 方法能够正确清空缓存。
  it('should clear the cache correctly', async () => {
    await cache.getAsync('key1')
    await cache.getAsync('key2')
    await cache.getAsync('key3')

    expect(cache.size()).toBe(3)

    cache.clear()

    expect(cache.size()).toBe(0)
    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBeUndefined()
    expect(cache.get('key3')).toBeUndefined()
  })

  // 复杂的 LRU 行为测试：测试在多次加载和访问后，缓存的 LRU 行为是否正确。
  it('should handle multiple keys and maintain correct LRU order', async () => {
    const keys = ['A', 'B', 'C', 'D', 'E']

    // Load A, B, C
    await cache.getAsync(keys[0]) // A
    await cache.getAsync(keys[1]) // B
    await cache.getAsync(keys[2]) // C

    // Access A to make it most recently used
    await cache.getAsync(keys[0])

    // Load D, should evict B
    await cache.getAsync(keys[3])

    // Load E, should evict C
    await cache.getAsync(keys[4])

    expect(cache.size()).toBe(3)
    expect(cache.get('A')).toBeDefined() // A
    expect(cache.get('B')).toBeUndefined() // B evicted
    expect(cache.get('C')).toBeUndefined() // C evicted
    expect(cache.get('D')).toBeDefined() // D
    expect(cache.get('E')).toBeDefined() // E
  })

  // 更新现有键并移动到头部：确保更新现有键时，值被正确更新并且键被移动到头部（最近使用）。
  it('should allow updating existing keys and move them to head', async () => {
    const key = 'updateKey'

    await cache.getAsync(key) // Load key
    expect(cache.size()).toBe(1)
    expect(cache.get(key)).toEqual({ value: `Value for ${key}` })

    // Mock loadFunction to return a different value
    loadFunction.mockImplementationOnce(async (k: string) => {
      return { value: `Updated value for ${k}` }
    })

    // Update the key by calling put directly
    cache.put(key, { value: `Updated value for ${key}` })

    const cachedValue = cache.get(key)
    expect(cachedValue).toEqual({ value: `Updated value for ${key}` })
  })
})
