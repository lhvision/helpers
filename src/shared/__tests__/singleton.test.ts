import { describe, expect, it } from 'vitest'
import { singleton } from '../singleton'

describe('singleton decorator', () => {
  it('应该返回相同的实例', () => {
    // 创建一个测试类
    @singleton
    class TestClass {
      private value: number = 0

      setValue(val: number) {
        this.value = val
      }

      getValue() {
        return this.value
      }
    }

    // 创建两个实例
    const instance1 = new TestClass()
    const instance2 = new TestClass()

    // 验证是同一个实例
    expect(instance1).toBe(instance2)

    // 验证状态共享
    instance1.setValue(42)
    expect(instance2.getValue()).toBe(42)
  })

  it('应该在传入不同参数时仍然返回相同实例', () => {
    @singleton
    class Person {
      constructor(public name: string, public age: number) {}
    }

    const person1 = new Person('张三', 20)
    const person2 = new Person('李四', 30)

    expect(person1).toBe(person2)
    expect(person1.name).toBe('张三') // 第一次创建的值保持不变
    expect(person2.name).toBe('张三')
  })

  it('不同类的单例应该相互独立', () => {
    @singleton
    class ServiceA {
      value = 'A'
    }

    @singleton
    class ServiceB {
      value = 'B'
    }

    const a1 = new ServiceA()
    const a2 = new ServiceA()
    const b1 = new ServiceB()
    const b2 = new ServiceB()

    expect(a1).toBe(a2)
    expect(b1).toBe(b2)
    expect(a1).not.toBe(b1)
    expect(a1.value).toBe('A')
    expect(b1.value).toBe('B')
  })
})
