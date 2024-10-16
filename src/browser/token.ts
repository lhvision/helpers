interface TokenPayload {
  exp: number
  iat: number
  sub: string
  username: string
  roles: string[]
}

export function getTokenPayload(token: string): TokenPayload | undefined {
  try {
    // Token 的 Payload 是在第二段
    const base64Url = token.split('.')[1]

    // Base64 解码并转为 JSON 对象
    const base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
  }
  catch (e) {
    console.error('Error parsingtoken:', e)
  }
}

/**
 * 判断 Token 是否即将过期
 * @param fiveMinutes 距离过期时间，默认 5 分钟
 */
export function isTokenExpiringSoon(token: string, fiveMinutes = 5 * 60 * 1000) {
  const payload = getTokenPayload(token)

  if (!payload)
    return true

  // 根据 "exp" 字段获取过期时间. 秒转换为毫秒
  const expiration = payload.exp * 1000

  return Date.now() + fiveMinutes >= expiration
}
