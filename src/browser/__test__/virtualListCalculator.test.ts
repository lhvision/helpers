import { describe, expect, it } from 'vitest'
import {
  findIndexForScroll,
  VirtualListCalculator,
} from '../virtualListCalculator'

describe('虚拟列表计算器测试', () => {
  describe('findIndexForScroll', () => {
    it('应该返回正确的滚动索引', () => {
      const heights = [50, 100, 150, 200, 250]
      expect(findIndexForScroll(heights, 0)).toBe(0)
      expect(findIndexForScroll(heights, 75)).toBe(1)
      expect(findIndexForScroll(heights, 250)).toBe(4)
    })

    it('应该处理边界情况', () => {
      const heights = [50, 100, 150]
      expect(findIndexForScroll(heights, -10)).toBe(0)
      expect(findIndexForScroll(heights, 160)).toBe(2)
    })
  })

  describe('virtualListCalculator', () => {
    const items = [
      { height: 50, index: 0 },
      { height: 50, index: 1 },
      { height: 50, index: 2 },
      { height: 50, index: 3 },
    ]
    const calculator = new VirtualListCalculator(items)

    it('应该正确计算可视范围', () => {
      const { start, end } = calculator.calculateVisibleRange(50, 100, 1)
      expect(start).toBe(0)
      expect(end).toBe(3)
    })

    it('应该正确计算区间高度', () => {
      expect(calculator.getHeightBetween(0, 1)).toBe(100)
      expect(calculator.getHeightBetween(1, 3)).toBe(150)
    })

    it('应该正确找到起始索引', () => {
      expect(calculator.findStartIndex(0)).toBe(0)
      expect(calculator.findStartIndex(75)).toBe(1)
      expect(calculator.findStartIndex(180)).toBe(3)
    })

    describe('边界情况处理', () => {
      const items = [
        { height: 50, index: 0 },
        { height: 50, index: 1 },
        { height: 50, index: 2 },
        { height: 50, index: 3 },
      ]
      const calculator = new VirtualListCalculator(items)

      it('应该正确处理最小可视范围', () => {
        const { start, end } = calculator.calculateVisibleRange(0, 50, 0)
        expect(start).toBe(0)
        expect(end).toBe(0)
      })

      it('应该处理不同的 overscan 值', () => {
        const { start, end } = calculator.calculateVisibleRange(0, 50, 1)
        expect(start).toBe(0)
        expect(end).toBe(1)
      })

      it('应该处理滚动位置超出范围的情况', () => {
        const { start, end } = calculator.calculateVisibleRange(250, 50, 0)
        expect(start).toBe(3)
        expect(end).toBe(3)
      })
    })
  })
})
