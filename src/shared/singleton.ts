/**
 * 使用 Proxy 代理模式实现单例模式
 * @param className 类
 * @returns 单例
 */
export function singleton<T extends new (...args: any[]) => any>(className: T) {
  let instance: InstanceType<T>
  const proxy = new Proxy(className, {
    construct(target, args) {
      if (!instance) {
        instance = Reflect.construct(target, args)
      }
      return instance
    },
  })
  proxy.prototype.constructor = className
  return proxy as T
}
