import type { DataOnlyConfig, RequestOptions, RequestResponse, ResponseTypeConfig } from './requestManager'
import { RequestError, requestManager } from './requestManager'

const defaultRequestOptions: RequestOptions = {
  baseURL: '',
  timeout: 30 * 60 * 1000,
  cacheConfig: { enable: false, ttl: 5 * 60 * 1000 },
  retry: { enable: false, count: 3, delay: 1000 },
  returnData: true,
}

async function sendRequest<T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
  url: string,
  options: RequestOptions = {},
): Promise<RequestResponse<T, R>> {
  // 获取请求管理器实例
  // const manager = RequestManager.getInstance()
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
    const cachedData = requestManager.getCache(cacheKey)
    if (cachedData)
      return cachedData
  }

  // 获取该 URL 对应的拦截器组
  const interceptors = requestManager.getInterceptors(fullUrl)

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
  const executeRequest = async (retryCount = 0): Promise<RequestResponse<T, R>> => {
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
        return response as RequestResponse<T, R>
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
        requestManager.setCache(`${baseURL}${url}`, finalResponse, cacheConfig.ttl!)

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
  return requestManager.executeRequest(() => executeRequest())
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
function requestWithBody<T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
  method: 'POST' | 'PUT',
  url: string,
  data?: HttpBody,
  options?: RequestOptions,
) {
  const { body, contentType } = resolveRequestBody(data)
  const headers = new Headers(options?.headers)

  if (contentType && !headers.has('Content-Type')) {
    headers.set('Content-Type', contentType)
  }

  return sendRequest<T, R>(url, {
    ...options,
    headers,
    method,
    body,
  })
}

function createRequest() {
  const requestFn = <T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
    url: string,
    options?: RequestOptions,
  ) => {
    return sendRequest<T, R>(url, options)
  }

  requestFn.get = <T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
    url: string,
    options?: RequestOptions,
  ) => {
    return sendRequest<T, R>(url, { ...options, method: 'GET' })
  }

  requestFn.post = <T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
    url: string,
    data?: HttpBody,
    options?: RequestOptions,
  ) => {
    return requestWithBody<T, R>('POST', url, data, options)
  }

  requestFn.put = <T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
    url: string,
    data?: HttpBody,
    options?: RequestOptions,
  ) => {
    return requestWithBody<T, R>('PUT', url, data, options)
  }

  requestFn.delete = <T = any, R extends ResponseTypeConfig = DataOnlyConfig>(
    url: string,
    options?: RequestOptions,
  ) => {
    return sendRequest<T, R>(url, {
      ...options,
      method: 'DELETE',
    })
  }

  return requestFn
}

/**
 * 基于 fetch 的请求函数，RequestManager 单例管理，功能包含：
 * 1. 第二个泛型 Config 支持按需配置返回值类型，默认 { returnData: true }，返回为 T 类型
 * 2. 并发控制，默认不做限制，可以使用 RequestManager.setMaxConcurrent 设置最大并发数
 * 3. 支持配置缓存
 * 4. 可以设置默认的以及为不同的域名设置不同的请求拦截器、响应拦截器、错误拦截器，单独的拦截器优先级高于默认的拦截器
 * 5. request.post 与 request.put 方法已支持自动转换请求体和添加 Content-Type: application/json
 * 6. 支持重试
 * 7. 支持手动取消请求
 * 8. 支持配置超时自动取消请求，默认 30 分钟
 */
export const request = createRequest()
