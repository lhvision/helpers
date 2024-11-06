type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// 请求配置接口，扩展自 fetch 的 RequestInit
interface RequestOptions extends RequestInit {
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
   * 是否直接返回原始 Response 对象
   * 用于流式下载等场景
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

// 自定义请求错误类
class RequestError extends Error {
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

// 拦截器注册器类
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

// 请求管理器类 - 使用单例模式
export class RequestManager {
  /** 单例实例 */
  private static instance: RequestManager
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
  static getInstance() {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager()
    }
    return RequestManager.instance
  }

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

const defaultRequestOptions: RequestOptions = {
  baseURL: '',
  timeout: 30 * 60 * 1000,
  cacheConfig: { enable: false, ttl: 5 * 60 * 1000 },
  retry: { enable: false, count: 3, delay: 1000 },
  returnData: true,
}

async function sendRequest<T = any>(
  url: string,
  options: RequestOptions = {},
): Promise<Response<T>> {
  // 获取请求管理器实例
  const manager = RequestManager.getInstance()
  // 合并默认配置
  const mergedOptions = { ...defaultRequestOptions, ...options }
  const {
    baseURL,
    timeout,
    cacheConfig,
    retry,
    signal,
    returnData,
    rawResponse,
    ...fetchOptions
  } = mergedOptions
  const fullUrl = `${baseURL}${url}`

  // 检查缓存
  if (cacheConfig?.enable) {
    const cacheKey = cacheConfig.key || `${baseURL}${url}`
    const cachedData = manager.getCache(cacheKey)
    if (cachedData)
      return cachedData
  }

  // 获取该 URL 对应的拦截器组
  const interceptors = manager.getInterceptors(fullUrl)

  // 应用请求拦截器
  let finalOptions = { ...fetchOptions }
  if (interceptors.request) {
    finalOptions = await interceptors.request(finalOptions)
  }

  // 创建用于超时控制的 AbortController
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

  // 组合用户提供的 signal 和超时 signal
  const controller = new AbortController()
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }
  timeoutController.signal.addEventListener('abort', () => controller.abort())

  // 执行请求的核心方法
  const executeRequest = async (retryCount = 0): Promise<Response<T>> => {
    try {
      const response = await fetch(fullUrl, {
        ...finalOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok)
        throw new RequestError(response.statusText, response.status, response as any)

      // 如果需要原始 Response，直接返回
      if (rawResponse) {
        return response as unknown as Response<T>
      }

      // 解析响应数据
      const data = await response.json()
      const result = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }

      // 应用响应拦截器
      let finalResponse = result
      if (interceptors.response) {
        finalResponse = await interceptors.response(finalResponse)
      }

      // 设置缓存
      if (cacheConfig?.enable)
        manager.setCache(`${baseURL}${url}`, finalResponse, cacheConfig.ttl!)

      return returnData ? finalResponse.data : finalResponse
    }
    catch (error: any) {
      clearTimeout(timeoutId)

      // 处理重试
      if (
        retry?.enable
        && retryCount < retry.count!
        && error.name !== 'AbortError'
      ) {
        await new Promise(resolve => setTimeout(resolve, retry.delay))
        return executeRequest(retryCount + 1)
      }

      // 创建 RequestError 实例
      const requestError = error instanceof RequestError
        ? error
        : new RequestError(
          error.message || 'RequestError',
          error.status,
          error.response,
          error.name,
        )

      // 应用错误拦截器
      if (interceptors.error) {
        await interceptors.error(requestError)
      }

      throw requestError
    }
  }

  // 通过请求管理器执行请求
  return manager.executeRequest(() => executeRequest())
}

type HttpBody = BodyInit | Record<string, any> | null

/** 处理请求体和对应的 Content-Type */
function resolveRequestBody(data?: HttpBody): {
  body: BodyInit | null
  contentType?: string
} {
  // 如果是 null 或 undefined，直接返回
  if (!data) {
    return { body: null }
  }

  // 如果已经是 BodyInit 类型，直接使用
  if (
    data instanceof FormData
    || data instanceof URLSearchParams
    || data instanceof Blob
    || data instanceof ArrayBuffer
    || data instanceof ReadableStream
    || typeof data === 'string'
  ) {
    return { body: data }
  }

  // 其他情况（普通对象或数组），转换为 JSON
  return {
    body: JSON.stringify(data),
    contentType: 'application/json',
  }
}

/** 处理带请求体的方法（POST、PUT 等） */
function requestWithBody<T = any>(method: 'POST' | 'PUT', url: string, data?: HttpBody, options?: RequestOptions) {
  const { body, contentType } = resolveRequestBody(data)
  const headers = new Headers(options?.headers)

  if (contentType && !headers.has('Content-Type')) {
    headers.set('Content-Type', contentType)
  }

  return sendRequest<T>(url, {
    ...options,
    headers,
    method,
    body,
  })
}

function createRequest() {
  const requestFn = <T = any>(url: string, options?: RequestOptions) => {
    return sendRequest<T>(url, options)
  }

  requestFn.get = <T = any>(url: string, options?: RequestOptions) => {
    return sendRequest<T>(url, { ...options, method: 'GET' })
  }

  requestFn.post = <T = any>(url: string, data?: HttpBody, options?: RequestOptions) => {
    return requestWithBody<T>('POST', url, data, options)
  }

  requestFn.put = <T = any>(url: string, data?: HttpBody, options?: RequestOptions) => {
    return requestWithBody<T>('PUT', url, data, options)
  }

  requestFn.delete = <T = any>(url: string, options?: RequestOptions) => {
    return sendRequest<T>(url, {
      ...options,
      method: 'DELETE',
    })
  }

  return requestFn
}

/**
 * 依赖于 fetch 的请求函数，RequestManager 单例管理，功能包含：
 * 1. 并发控制，默认不做限制，可以使用 RequestManager.setMaxConcurrent 设置最大并发数
 * 2. 支持配置缓存
 * 3. 可以设置默认的以及为不同的域名设置不同的请求拦截器、响应拦截器、错误拦截器，单独的拦截器优先级高于默认的拦截器
 * 4. request.post 与 request.put 方法已支持自动转换请求体和添加 Content-Type: application/json
 * 5. 支持重试
 * 6. 支持手动取消请求
 * 7. 支持配置超时自动取消请求，默认 30 分钟
 */
export const request = createRequest()
