// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { getTokenPayload, isTokenExpiringSoon } from '../token'

const testJWToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjg0NjYxNTIwLCJleHAiOjE2ODQ2NjUxMjB9.PXhGjCvthQ_r4EuMy_CQhRm4Gz6APU6rT9Yt4ct57-U'

// exp 2023-05-21 18:32:00
const payload = { username: 'testuser', role: 'admin', iat: 1684661520, exp: 1684665120 }

describe('token 测试', () => {
  it('是否正确解析 Payload', () => {
    expect(getTokenPayload(testJWToken)).toEqual(payload)
  })

  it('是否正确判断 Token 已过期', () => {
    expect(isTokenExpiringSoon(testJWToken)).toBe(true)
  })
})
