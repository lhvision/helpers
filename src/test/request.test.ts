import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request, RequestManager } from '../shared/request'

describe('请求模块测试', () => {
  let manager: RequestManager

  beforeEach(() => {
    // 重置单例实例和清理 mock
    manager = RequestManager.getInstance()
    manager.clearCache()
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      headers: new Headers(),
    })
  })

  it('requestManager 应该是单例模式', () => {
    const instance1 = RequestManager.getInstance()
    const instance2 = RequestManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('requestManager 应该能够添加和获取拦截器', () => {
    const requestInterceptor = (config: any) => config
    const responseInterceptor = (response: any) => response
    const errorInterceptor = (error: any) => error

    manager.addRequestInterceptor(requestInterceptor)
    manager.addResponseInterceptor(responseInterceptor)
    manager.addErrorInterceptor(errorInterceptor)

    expect(manager.getRequestInterceptors()).toContain(requestInterceptor)
    expect(manager.getResponseInterceptors()).toContain(responseInterceptor)
    expect(manager.getErrorInterceptors()).toContain(errorInterceptor)
  })

  it('request 函数应该能成功发送GET请求', async () => {
    const mockData = { message: '成功' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    })

    const response = await request('https://api.example.com/test', {
      returnData: false,
    })
    expect(response.data).toEqual(mockData)
    expect(response.status).toBe(200)
  })

  it('request 函数应该处理请求错误', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    })

    await expect(request('https://api.example.com/test')).rejects.toThrow()
  })

  it('request 函数应该支持请求缓存', async () => {
    const mockData = { message: '缓存数据' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    })

    // 第一次请求
    await request('https://api.example.com/test', {
      cacheConfig: { enable: true, ttl: 1000 },
    })

    // 第二次请求应该使用缓存
    await request('https://api.example.com/test', {
      cacheConfig: { enable: true, ttl: 1000 },
    })

    // fetch 应该只被调用一次
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('get 方法应该发送 GET 请求', async () => {
    await request.get('https://api.example.com/test')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('post 方法应该发送 POST 请求', async () => {
    const data = { name: 'test' }
    await request.post('https://api.example.com/test', data)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    )
  })

  it('put 方法应该发送 PUT 请求', async () => {
    const data = { name: 'test' }
    await request.put('https://api.example.com/test', data)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    )
  })

  it('delete 方法应该发送 DELETE 请求', async () => {
    await request.delete('https://api.example.com/test')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('request 函数应该支持请求超时', async () => {
    const mockError = new Error('请求超时')
    globalThis.fetch = vi.fn().mockImplementation(() =>
      new Promise((_, reject) => {
        setTimeout(() => reject(mockError), 1000)
      }),
    )

    await expect(
      request('https://api.example.com/test', {
        timeout: 500,
      }),
    ).rejects.toThrow()
  })

  it('request 函数应该支持手动取消请求', async () => {
    const controller = new AbortController()

    // 模拟一个会等待的请求
    globalThis.fetch = vi.fn().mockImplementation(() =>
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('The user aborted a request.')), 1000)
      }),
    )

    const promise = request('https://api.example.com/test', {
      signal: controller.signal,
    })

    // 确保在请求完成之前取消
    controller.abort()

    await expect(promise).rejects.toThrow('The user aborted a request.')
  })

  it('request 函数应该支持重试机制', async () => {
    let attempts = 0
    globalThis.fetch = vi.fn().mockImplementation(() => {
      attempts++
      if (attempts === 1) {
        // 第一次请求失败
        return Promise.reject(new Error('网络错误'))
      }
      // 第二次请求成功
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      })
    })

    const response = await request('https://api.example.com/test', {
      retry: {
        enable: true,
        count: 3,
        delay: 100,
      },
      returnData: false,
    })

    expect(attempts).toBe(2)
    expect(response.status).toBe(200)
  })

  it('request 函数应该正确应用拦截器', async () => {
    const mockData = { original: true }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    })

    // 添加请求拦截器
    manager.addRequestInterceptor((config: any) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Test': 'test-value',
        },
      }
    })

    await request('https://api.example.com/test')

    // 验证请求拦截器是否被调用
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Test': 'test-value',
        }),
      }),
    )
  })

  it('request 函数应该正确处理错误拦截器', async () => {
    const mockError = new Error('测试错误')
    globalThis.fetch = vi.fn().mockRejectedValue(mockError)

    let interceptedError: Error | null = null
    manager.addErrorInterceptor((error: Error) => {
      interceptedError = error
      throw error
    })

    await expect(request('https://api.example.com/test')).rejects.toThrow()
    expect(interceptedError).toBeTruthy()
  })
})
