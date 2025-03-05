/* eslint-disable no-extend-native */

function executeFunctionWithContext(context, fn, args) {
  // 处理 context 为 null 或 undefined 的情况
  context = context || window
  // 为 context 创建一个唯一的临时属性
  const key = Symbol('temp')
  // 将当前函数作为 context 的方法
  context[key] = fn
  // 执行函数并获取结果
  const result = context[key](...args)
  // 删除临时属性
  delete context[key]
  // 返回执行结果
  return result
}

// 手写 call 实现
Function.prototype.myCall = function (context, ...args) {
  return executeFunctionWithContext(context, this, args)
}

// 手写 apply 实现
Function.prototype.myApply = function (context, args = []) {
  return executeFunctionWithContext(context, this, args)
}

// 手写 bind 实现
Function.prototype.myBind = function (context, ...args) {
  // 保存原函数的引用
  const self = this

  // 返回一个新函数
  return function (...newArgs) {
    // 将之前传入的参数和新传入的参数合并
    const finalArgs = [...args, ...newArgs]
    return executeFunctionWithContext(context, self, finalArgs)
  }
}

const obj = {
  name: '测试对象',
}

function test(...args) {
  console.log(this.name, args)
}

// 测试 myCall
test.myCall(obj, 1, 2, 3) // 输出: "测试对象" [1, 2, 3]

// 测试 myApply
test.myApply(obj, [1, 2, 3]) // 输出: "测试对象" [1, 2, 3]

// 测试 myBind
const boundFn = test.myBind(obj, 1, 2)
boundFn(3, 4) // 输出: "测试对象" [1, 2, 3, 4]

// 冒泡排序（Bubble Sort） O(n^2)。
function bubbleSort(arr) {
  const n = arr.length
  // 外层循环控制比较的轮数
  for (let i = 0; i < n - 1; i++) {
    // 内层循环控制每一轮比较的次数
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // 交换，大的元素往后移动
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
  return arr
}

const arr = [5, 2, 9, 1, 5, 6]
console.log(bubbleSort(arr)) // [1, 2, 5, 5, 6, 9]

// 快速排序（Quick Sort）O(nlogn)。
function quickSort(arr) {
  if (arr.length <= 1)
    return arr

  const pivot = arr[arr.length - 1] // 选择最后一个元素作为基准值
  const left = []
  const right = []

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i])
    }
    else {
      right.push(arr[i])
    }
  }

  return [...quickSort(left), pivot, ...quickSort(right)]
}

function quickSortTt(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right)
    quickSortTt(arr, left, pivotIndex - 1)
    quickSortTt(arr, pivotIndex + 1, right)
  }
  return arr
}

function partition(arr, left, right) {
  const pivot = arr[right]
  let i = left - 1

  for (let j = left; j < right; j++) {
    if (arr[j] <= pivot) {
      i++
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }

  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]]
  return i + 1
}

const arr2 = [5, 2, 9, 1, 5, 6]
console.time('quickSort')
console.log(quickSort(arr2)) // [1, 2, 5, 5, 6, 9]
console.timeEnd('quickSort')
console.time('quickSortTt')
console.log(quickSortTt(arr2)) // [1, 2, 5, 5, 6, 9]
console.timeEnd('quickSortTt')
