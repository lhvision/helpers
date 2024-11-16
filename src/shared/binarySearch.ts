/**
 * 通用二分查找函数
 * @param arr 已排序的数组
 * @param target 目标值
 * @param compareFn 可选的比较函数
 * @returns 目标值的索引，如果未找到则返回 -1
 */
export function binarySearch<T>(
  arr: T[],
  target: T,
  compareFn: (a: T, b: T) => number = (a, b) => {
    if (a < b)
      return -1
    if (a > b)
      return 1
    return 0
  },
): number {
  // 初始化左右指针
  let left = 0
  let right = arr.length - 1

  // 循环查找
  while (left <= right) {
    // 计算中间索引
    const mid = left + Math.floor((right - left) / 2)
    // 比较中间值和目标值
    const compareResult = compareFn(arr[mid], target)

    // 如果中间值等于目标值，返回中间索引
    if (compareResult === 0) {
      return mid
    }
    // 如果中间值小于目标值，移动左指针
    else if (compareResult < 0) {
      left = mid + 1
    }
    // 如果中间值大于目标值，移动右指针
    else {
      right = mid - 1
    }
  }

  // 未找到目标值，返回 -1
  return -1
}

/**
 * 查找目标值应该插入的位置（保持数组有序）
 * @param arr 已排序的数组
 * @param target 目标值
 * @param compareFn 可选的比较函数
 * @returns 插入位置的索引
 */
export function binarySearchInsertPosition<T>(
  arr: T[],
  target: T,
  compareFn: (a: T, b: T) => number = (a, b) => {
    if (a < b)
      return -1
    if (a > b)
      return 1
    return 0
  },
): number {
  // 初始化左右指针
  let left = 0
  let right = arr.length

  // 循环查找
  while (left < right) {
    // 计算中间索引
    const mid = left + Math.floor((right - left) / 2)
    // 比较中间值和目标值
    const compareResult = compareFn(arr[mid], target)

    // 如果中间值小于目标值，移动左指针
    if (compareResult < 0) {
      left = mid + 1
    }
    // 如果中间值大于等于目标值，移动右指针
    else {
      right = mid
    }
  }

  // 返回插入位置的索引
  return left
}
