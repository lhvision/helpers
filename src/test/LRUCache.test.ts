import { beforeEach, describe, expect, it } from 'vitest'
import { LRUCache } from '../shared/LRUCache' // 假设你的 LRUCache 文件路径为 src/LRUCache

describe('lRUCache', () => {
  let cache: LRUCache<number, number>

  beforeEach(() => {
    cache = new LRUCache<number, number>(3) // 初始化一个容量为3的缓存
  })

  // 测试 put 和 get 方法，确保插入和读取的行为正常
  it('should set and get values', () => {
    cache.put(1, 100)
    cache.put(2, 200)

    expect(cache.get(1)).toBe(100)
    expect(cache.get(2)).toBe(200)
    expect(cache.get(3)).toBeUndefined() // 未设置的key应该返回undefined
  })

  // 通过访问和插入数据，验证了最近最少使用（Least Recently Used）的元素会被移除
  it('should move accessed items to the head', () => {
    cache.put(1, 100)
    cache.put(2, 200)
    cache.put(3, 300)

    cache.get(1) // 访问key 1，key 1 应该成为最常用的元素
    cache.put(4, 400) // 插入新元素，最旧的 key 2 应该被移除

    expect(cache.get(1)).toBe(100) // key 1 仍应存在
    expect(cache.get(2)).toBeUndefined() // key 2 应被移除
    expect(cache.get(3)).toBe(300)
    expect(cache.get(4)).toBe(400)
  })

  // 超过容量时验证是否会正确地移除最久未使用的元素
  it('should evict the least recently used item when capacity is exceeded', () => {
    cache.put(1, 100)
    cache.put(2, 200)
    cache.put(3, 300)
    cache.put(4, 400) // 超过容量限制

    expect(cache.get(1)).toBeUndefined() // key 1 应该被移除
    expect(cache.get(2)).toBe(200)
    expect(cache.get(3)).toBe(300)
    expect(cache.get(4)).toBe(400)
  })

  // 测试更新已存在的 key 的行为
  it('should update value if the key exists', () => {
    cache.put(1, 100)
    cache.put(1, 150) // 更新值

    expect(cache.get(1)).toBe(150) // key 1 的值应更新
  })

  // 测试 clear 方法，确保缓存可以被正确清空
  it('should clear all items in the cache', () => {
    cache.put(1, 100)
    cache.put(2, 200)
    cache.clear()

    expect(cache.get(1)).toBeUndefined()
    expect(cache.get(2)).toBeUndefined()
    expect(cache.size()).toBe(0) // 清空后缓存大小应为0
  })

  it('should return the correct size', () => {
    expect(cache.size()).toBe(0) // 初始大小应为0

    cache.put(1, 100)
    cache.put(2, 200)

    expect(cache.size()).toBe(2) // 插入两个元素后大小应为2
  })

  // 测试处理容量变化的边缘情况
  it('should handle edge cases for capacity changes', () => {
    cache.put(1, 100)
    cache.put(2, 200)
    cache.put(3, 300)

    cache.setCapacity(2) // 容量减小到2

    expect(cache.get(1)).toBeUndefined() // key 1 应该被移除
    expect(cache.get(2)).toBe(200)
    expect(cache.get(3)).toBe(300)
    expect(cache.size()).toBe(2)

    cache.setCapacity(3) // 容量增加到3
    cache.put(4, 400)

    expect(cache.size()).toBe(3) // 添加新元素后，大小应为3
  })

  // 测试 setCapacity，确保容量调整时，缓存数据能根据新的容量进行调整
  it('should handle cache capacity of 1', () => {
    const smallCache = new LRUCache<number, number>(1)

    smallCache.put(1, 100)
    expect(smallCache.get(1)).toBe(100)

    smallCache.put(2, 200) // 插入新元素时，key 1 应该被移除
    expect(smallCache.get(1)).toBeUndefined()
    expect(smallCache.get(2)).toBe(200)
  })

  // 处理容量设置为 0 或负数时的异常情况
  it('should throw an error when setting a negative or zero capacity', () => {
    expect(() => new LRUCache<number, number>(0)).toThrow('Capacity must be a positive number')
    expect(() => new LRUCache<number, number>(-1)).toThrow('Capacity must be a positive number')
  })
})
