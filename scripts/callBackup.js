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
  Reflect.deleteProperty(context, key)
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
