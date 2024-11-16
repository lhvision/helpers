import { describe, expect, it } from 'vitest'
import {
  binarySearch,
  binarySearchInsertPosition,
} from '../binarySearch'

describe('二分查找相关函数测试', () => {
  describe('binarySearch', () => {
    it('应该能在数字数组中找到目标值', () => {
      const arr = [1, 3, 5, 7, 9, 11]
      expect(binarySearch(arr, 5)).toBe(2)
      expect(binarySearch(arr, 11)).toBe(5)
      expect(binarySearch(arr, 1)).toBe(0)
    })

    it('当目标值不存在时应该返回-1', () => {
      const arr = [1, 3, 5, 7, 9, 11]
      expect(binarySearch(arr, 4)).toBe(-1)
      expect(binarySearch(arr, 0)).toBe(-1)
      expect(binarySearch(arr, 12)).toBe(-1)
    })

    it('应该能处理自定义比较函数', () => {
      const arr = [
        { value: 1 },
        { value: 3 },
        { value: 5 },
      ]
      const compareFn = (a: { value: number }, b: { value: number }) => a.value - b.value
      expect(binarySearch(arr, { value: 3 }, compareFn)).toBe(1)
      expect(binarySearch(arr, { value: 4 }, compareFn)).toBe(-1)
    })

    it('应该能处理空数组', () => {
      expect(binarySearch([], 1)).toBe(-1)
    })
  })

  describe('binarySearchInsertPosition', () => {
    it('应该返回正确的插入位置', () => {
      const arr = [1, 3, 5, 7, 9]
      expect(binarySearchInsertPosition(arr, 4)).toBe(2)
      expect(binarySearchInsertPosition(arr, 0)).toBe(0)
      expect(binarySearchInsertPosition(arr, 10)).toBe(5)
    })

    it('对于已存在的值应该返回其位置', () => {
      const arr = [1, 3, 5, 7, 9]
      expect(binarySearchInsertPosition(arr, 3)).toBe(1)
      expect(binarySearchInsertPosition(arr, 9)).toBe(4)
    })

    it('应该能处理空数组', () => {
      expect(binarySearchInsertPosition([], 1)).toBe(0)
    })
  })
})
