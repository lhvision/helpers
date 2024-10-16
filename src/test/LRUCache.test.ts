import { describe, expect, it } from 'vitest'
import { LRUCache } from '../shared/LRUCache'

describe('lruCache', () => {
  it('should initialize correctly', () => {
    const cache = new LRUCache<number, string>(2)
    expect(cache.size()).toBe(0)
    expect(cache.getCapacity()).toBe(2)
  })

  it('should put and get values correctly', () => {
    const cache = new LRUCache<number, string>(2)
    cache.put(1, 'one')
    cache.put(2, 'two')
    expect(cache.get(1)).toBe('one')
    expect(cache.get(2)).toBe('two')
  })

  it('should evict least recently used item when capacity is exceeded', () => {
    const cache = new LRUCache<number, string>(2)
    cache.put(1, 'one')
    cache.put(2, 'two')
    cache.get(1) // 1 becomes most recently used
    cache.put(3, 'three') // evicts key 2
    expect(cache.get(2)).toBeUndefined()
    expect(cache.get(1)).toBe('one')
    expect(cache.get(3)).toBe('three')
  })

  it('should update value and move to head on put if key exists', () => {
    const cache = new LRUCache<number, string>(2)
    cache.put(1, 'one')
    cache.put(2, 'two')
    cache.put(1, 'ONE') // update value
    expect(cache.get(1)).toBe('ONE')
    cache.put(3, 'three') // evicts key 2
    expect(cache.get(2)).toBeUndefined()
  })

  it('should clear cache correctly', () => {
    const cache = new LRUCache<number, string>(2)
    cache.put(1, 'one')
    cache.put(2, 'two')
    cache.clear()
    expect(cache.size()).toBe(0)
    expect(cache.get(1)).toBeUndefined()
    expect(cache.get(2)).toBeUndefined()
  })

  it('should handle capacity changes correctly', () => {
    const cache = new LRUCache<number, string>(3)
    cache.put(1, 'one')
    cache.put(2, 'two')
    cache.put(3, 'three')
    cache.setCapacity(2)
    expect(cache.size()).toBe(2)
    expect(cache.get(1)).toBeUndefined() // 1 was least recently used
    expect(cache.get(2)).toBe('two')
    expect(cache.get(3)).toBe('three')
  })
})
