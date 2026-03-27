import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createToken, consumeToken } from '../../server/utils/embedTokenStore'

describe('embedTokenStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createToken', () => {
    it('should return a valid UUID string', () => {
      const token = createToken('https://example.com/embed', 'user1')
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should return unique tokens for each call', () => {
      const token1 = createToken('https://example.com/embed', 'user1')
      const token2 = createToken('https://example.com/embed', 'user1')
      expect(token1).not.toBe(token2)
    })
  })

  describe('consumeToken', () => {
    it('should return the embed URL for a valid token', () => {
      const url = 'https://lookerstudio.google.com/embed/reporting/abc123'
      const token = createToken(url, 'user1')

      const result = consumeToken(token)
      expect(result).toBe(url)
    })

    it('should return null on second use (one-time use)', () => {
      const token = createToken('https://example.com/embed', 'user1')

      expect(consumeToken(token)).toBe('https://example.com/embed')
      expect(consumeToken(token)).toBeNull()
    })

    it('should return null for non-existent token', () => {
      expect(consumeToken('non-existent-token')).toBeNull()
    })

    it('should return null for expired token (after 30s TTL)', () => {
      const token = createToken('https://example.com/embed', 'user1')

      // Advance time past the 30s TTL
      vi.advanceTimersByTime(31_000)

      expect(consumeToken(token)).toBeNull()
    })

    it('should return URL if consumed before TTL expires', () => {
      const token = createToken('https://example.com/embed', 'user1')

      // Advance time but stay within TTL
      vi.advanceTimersByTime(29_000)

      expect(consumeToken(token)).toBe('https://example.com/embed')
    })
  })

  describe('multiple tokens', () => {
    it('should manage multiple tokens independently', () => {
      const token1 = createToken('https://example.com/dash1', 'user1')
      const token2 = createToken('https://example.com/dash2', 'user2')

      expect(consumeToken(token1)).toBe('https://example.com/dash1')
      expect(consumeToken(token2)).toBe('https://example.com/dash2')

      // Both consumed — second use should fail
      expect(consumeToken(token1)).toBeNull()
      expect(consumeToken(token2)).toBeNull()
    })

    it('should only expire the older token when time passes', () => {
      const token1 = createToken('https://example.com/dash1', 'user1')

      vi.advanceTimersByTime(20_000) // 20s passed

      const token2 = createToken('https://example.com/dash2', 'user2')

      vi.advanceTimersByTime(11_000) // 31s total for token1, 11s for token2

      expect(consumeToken(token1)).toBeNull() // expired
      expect(consumeToken(token2)).toBe('https://example.com/dash2') // still valid
    })
  })
})
