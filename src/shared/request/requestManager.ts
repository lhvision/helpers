type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** 请求配置接口，扩展自 fetch 的 RequestInit */
export interface RequestOptions extends RequestInit {
  /** 基础URL，会与请求URL拼接 */
  baseURL?: string
  /**
   * 超时时间（毫秒）
   * @defaultValue 30 分钟
   */
  timeout?: number
  /** 缓存配置 */
  cacheConfig?: CacheConfig
  /** 重试配置 */
  retry?: RetryConfig
  /**
   * 使用 AbortController 控制取消请求
   * const controller = new AbortController();
   * signal: controller.signal
   */
  signal?: AbortSignal
  /** 请求类型 */
  method?: RequestMethod
  /**
   * 是否直接返回 data 数据
   * @defaultValue true
   */
  returnData?: boolean
  /**
   * 是否直接返回原始 Response 对象，用于流式下载等场景
   * @defaultValue false
   */
  rawResponse?: boolean
}

// 统一的响应格式
interface Response<T = any> {
  /** 响应数据 */
  data: T
  /** HTTP状态码 */
  status: number
  /** 状态描述 */
  statusText: string
  /** 响应头 */
  headers: Headers
}

/** 直接返回原始 Response 对象 */
export interface RawResponseConfig {
  rawResponse: true
  returnData?: never
}

/** 返回完整的 Response 对象 */
export interface FullResponseConfig {
  rawResponse?: never
  returnData: false
}

/** 返回响应数据 */
export interface DataOnlyConfig {
  rawResponse?: never
  returnData: true
}

/** 响应类型配置 */
export type ResponseTypeConfig = RawResponseConfig | FullResponseConfig | DataOnlyConfig

/** 请求响应类型 */
export type RequestResponse<T, Config extends ResponseTypeConfig> = Config extends RawResponseConfig
  ? globalThis.Response
  : Config extends FullResponseConfig
    ? Response<T>
    : T

/** 自定义请求错误类 */
export class RequestError extends Error {
  constructor(
    /** 错误信息 */
    public message: string,
    /** HTTP状态码 */
    public status?: number,
    /** 响应 */
    public response?: Response,
    /** 错误名称 */
    public errorName?: string,
  ) {
    super(message)
    this.name = errorName || 'RequestError'
  }
}

// 拦截器类型定义
type RequestInterceptor = (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
type ResponseInterceptor = (response: Response) => Response | Promise<Response>
type ErrorInterceptor = (error: RequestError) => any

// 缓存接口
interface CacheConfig {
  /** 是否启用缓存 */
  enable?: boolean
  /**
   * 缓存时间（毫秒）
   * @defaultValue 5 分钟
   */
  ttl?: number
  /** 自定义缓存键 */
  key?: string
}

// 重试配置
interface RetryConfig {
  /** 是否启用重试 */
  enable?: boolean
  /**
   * 重试次数
   * @defaultValue 3
   */
  count?: number
  /**
   * 重试延迟（毫秒）
   * @defaultValue 1000
   */
  delay?: number
}

// 定义拦截器组的类型
interface InterceptorGroup {
  /** 请求拦截器 */
  request?: RequestInterceptor
  /** 响应拦截器 */
  response?: ResponseInterceptor
  /** 错误拦截器 */
  error?: ErrorInterceptor
}

/** 拦截器注册器类 */
class InterceptorRegistry {
  private interceptorMap = new Map<string, InterceptorGroup>()
  private defaultGroup: InterceptorGroup | null = null

  /** 注册拦截器组 */
  register(domain: string, group: Partial<InterceptorGroup>) {
    const existing = this.interceptorMap.get(domain) || {}
    this.interceptorMap.set(domain, { ...existing, ...group })
  }

  /** 设置默认拦截器组 */
  setDefault(group: Partial<InterceptorGroup>) {
    this.defaultGroup = { ...this.defaultGroup, ...group }
  }

  /** 获取特定域名的拦截器组 */
  getInterceptors(url: string): InterceptorGroup {
    const domain = this.extractDomain(url)
    return {
      ...this.defaultGroup,
      ...this.interceptorMap.get(domain),
    } as InterceptorGroup
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    }
    catch {
      return url
    }
  }
}

class RequestManager {
  /** 单例实例 */
  // private static instance: RequestManager
  /** 拦截器注册器 */
  private interceptorRegistry = new InterceptorRegistry()
  /** 缓存存储，使用 Map 结构存储请求结果 */
  private cache = new Map<string, { data: any, timestamp: number }>()
  /** 最大同时进行的请求数 */
  private maxConcurrent?: number
  /** 当前正在处理的请求数 */
  private currentRequests = 0
  /** 等待队列 */
  private queue: Array<() => Promise<any>> = []

  /** 获取单例实例 */
  // static getInstance() {
  //   if (!RequestManager.instance) {
  //     RequestManager.instance = new RequestManager()
  //   }
  //   return RequestManager.instance
  // }

  /** 注册域名特定的拦截器组 */
  registerInterceptors(domain: string, group: InterceptorGroup) {
    this.interceptorRegistry.register(domain, group)
  }

  /** 设置默认拦截器组 */
  setDefaultInterceptors(group: InterceptorGroup) {
    this.interceptorRegistry.setDefault(group)
  }

  /** 获取特定 URL 的拦截器组 */
  getInterceptors(url: string) {
    return this.interceptorRegistry.getInterceptors(url)
  }

  /** 设置缓存 */
  setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    })
  }

  /** 获取缓存 */
  getCache(key: string) {
    const cached = this.cache.get(key)
    if (!cached)
      return null
    if (Date.now() > cached.timestamp) {
      this.cache.delete(key)
      return null
    }
    return cached.data
  }

  /** 清除缓存 */
  clearCache() {
    this.cache.clear()
  }

  /** 设置最大并发数 */
  setMaxConcurrent(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent
  }

  /** 请求执行方法 - 并发控制 */
  async executeRequest<T>(
    request: () => Promise<T>,
  ): Promise<T> {
    if (!this.maxConcurrent) {
      return await request()
    }
    // 如果当前请求数达到上限，加入等待队列
    if (this.currentRequests >= this.maxConcurrent) {
      return new Promise((resolve) => {
        this.queue.push(async () => {
          const result = await request()
          resolve(result)
        })
      })
    }
    // 执行请求
    this.currentRequests++
    try {
      return await request()
    }
    finally {
      this.currentRequests--
      // 处理队列中的下一个请求
      if (this.queue.length > 0) {
        const nextRequest = this.queue.shift()
        nextRequest?.()
      }
    }
  }
}

/** 请求管理器类 - 使用单例模式 */
export const requestManager = new RequestManager()
