/**
 * 针对虚拟列表优化的二分查找
 * @param heights 累积高度数组
 * @param scrollTop 目标滚动位置
 * @returns 应该渲染的起始索引
 */
export function findIndexForScroll(heights: number[], scrollTop: number): number {
  // 初始化左右指针
  let left = 0
  let right = heights.length - 1

  // 处理边界情况
  if (scrollTop <= 0)
    return 0
  // 如果滚动位置大于等于最后一个元素的高度，返回最后一个元素的索引
  if (scrollTop >= heights[right])
    return right

  while (left < right) {
    // 计算中间索引
    const mid = left + Math.floor((right - left) / 2)

    // 不需要判断相等的情况，因为：
    // 1. scrollTop 很可能不会精确等于某个累积高度
    // 2. 我们需要找到第一个大于 scrollTop 的位置
    if (heights[mid] < scrollTop) {
      left = mid + 1
    }
    else {
      right = mid
    }
  }

  // 返回前做一个额外的检查，确保我们返回的是第一个可见项
  return left > 0 && heights[left - 1] > scrollTop ? left - 1 : left
}

interface VirtualListItem {
  height: number // 每项的高度
  index: number // 项的索引
}

export class VirtualListCalculator {
  /** 累积高度数组 */
  private heightsAccumulator: number[] = []

  constructor(private items: VirtualListItem[]) {
    this.initHeightsAccumulator()
  }

  /**
   * 初始化累积高度数组
   */
  private initHeightsAccumulator(): void {
    let accumHeight = 0
    this.heightsAccumulator = this.items.map((item) => {
      accumHeight += item.height
      return accumHeight
    })
  }

  /**
   * 根据滚动位置查找对应的列表项索引
   * @param scrollTop 滚动位置
   * @returns 第一个可见项的索引
   */
  findStartIndex(scrollTop: number): number {
    return findIndexForScroll(this.heightsAccumulator, scrollTop)
  }

  /**
   * 计算可视区域内应该渲染的项
   * @param scrollTop 滚动位置
   * @param viewportHeight 可视区域高度
   * @param overscan 上下额外渲染的项数
   * @returns 需要渲染的项的范围
   */
  calculateVisibleRange(
    scrollTop: number,
    viewportHeight: number,
    overscan: number = 3,
  ): { start: number, end: number } {
    // 计算第一个可见项的索引
    const startIndex = Math.max(0, this.findStartIndex(scrollTop) - overscan)

    // 为了更精确地计算结束索引，我们查找第一个超出可视区域的项
    const endIndex = Math.min(
      this.items.length - 1,
      this.findStartIndex(scrollTop + viewportHeight) + overscan,
    )

    return { start: startIndex, end: endIndex }
  }

  /**
   * 获取指定索引范围内的总高度
   * @param start 起始索引
   * @param end 结束索引
   * @returns 总高度
   */
  getHeightBetween(start: number, end: number): number {
    // 获取结束索引对应的高度
    const endHeight = this.heightsAccumulator[end] || 0
    // 获取起始索引对应的高度
    const startHeight = start > 0 ? this.heightsAccumulator[start - 1] : 0
    // 返回总高度
    return endHeight - startHeight
  }

  /**
   * 更新指定索引项的高度
   * @param index 要更新的项的索引
   * @param newHeight 新的高度
   */
  updateItemHeight(index: number, newHeight: number): void {
    // 计算高度差
    const heightDiff = newHeight - this.items[index].height
    // 如果高度差为0，则不进行更新
    if (heightDiff === 0)
      return

    // 更新项的高度
    this.items[index].height = newHeight

    // 更新该索引后的所有累积高度
    for (let i = index; i < this.heightsAccumulator.length; i++) {
      this.heightsAccumulator[i] += heightDiff
    }
  }

  /**
   * 批量更新多个项的高度
   * @param updates { index: number, height: number }[] 更新数组
   */
  batchUpdateHeights(updates: Array<{ index: number, height: number }>): void {
    // 按索引排序以确保正确更新
    updates.sort((a, b) => a.index - b.index)

    // 批量更新
    for (const update of updates) {
      this.updateItemHeight(update.index, update.height)
    }
  }

  /**
   * 获取指定索引项的位置信息
   * @param index 项的索引
   * @returns 项的位置信息
   */
  getItemPosition(index: number): { top: number, height: number } {
    // 获取项的顶部位置
    const top = index > 0 ? this.heightsAccumulator[index - 1] : 0
    // 获取项的高度
    const height = this.items[index].height
    // 返回项的位置信息
    return { top, height }
  }
}
