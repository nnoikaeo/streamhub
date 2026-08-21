import { describe, it, expect, vi, afterEach } from 'vitest'
import { createEmbedToken, verifyEmbedToken, TOKEN_TTL_SECONDS } from '../../server/utils/embedToken'

const SECRET = 'test-secret-value'
const URL = 'https://lookerstudio.google.com/embed/reporting/abc123'

describe('embedToken', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createEmbedToken', () => {
    it('returns an opaque token that does not leak the embed URL', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)

      expect(token).not.toContain('lookerstudio')
      expect(Buffer.from(token, 'base64url').toString('utf8')).not.toContain('lookerstudio')
    })

    it('returns a different token each call for the same input', () => {
      expect(createEmbedToken(URL, 'user1', SECRET)).not.toBe(createEmbedToken(URL, 'user1', SECRET))
    })

    it('throws when no secret is configured', () => {
      expect(() => createEmbedToken(URL, 'user1', '')).toThrow('EMBED_TOKEN_SECRET is not configured')
    })
  })

  describe('verifyEmbedToken', () => {
    it('returns the signed payload', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)
      const payload = verifyEmbedToken(token, SECRET)

      expect(payload?.embedUrl).toBe(URL)
      expect(payload?.uid).toBe('user1')
      expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    // The whole point of BUG-031: verification carries no per-instance state,
    // so a token minted "elsewhere" still verifies.
    it('verifies a token it did not mint, given the same secret', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)
      expect(verifyEmbedToken(token, SECRET)?.embedUrl).toBe(URL)
    })

    it('stays valid across repeated use', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)
      expect(verifyEmbedToken(token, SECRET)).not.toBeNull()
      expect(verifyEmbedToken(token, SECRET)).not.toBeNull()
      expect(verifyEmbedToken(token, SECRET)).not.toBeNull()
    })

    it('rejects a token sealed with another secret', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)
      expect(verifyEmbedToken(token, 'another-secret')).toBeNull()
    })

    it('rejects a tampered ciphertext', () => {
      const raw = Buffer.from(createEmbedToken(URL, 'user1', SECRET), 'base64url')
      const last = raw.length - 1
      raw.writeUInt8(raw.readUInt8(last) ^ 0xff, last)

      expect(verifyEmbedToken(raw.toString('base64url'), SECRET)).toBeNull()
    })

    it('rejects a payload that was never sealed', () => {
      const forged = Buffer.from(
        JSON.stringify({ embedUrl: 'https://evil.example.com', uid: 'user1', exp: 2000000000 })
      ).toString('base64url')

      expect(verifyEmbedToken(forged, SECRET)).toBeNull()
    })

    it('rejects a token past its expiry', () => {
      vi.useFakeTimers()
      const token = createEmbedToken(URL, 'user1', SECRET)

      vi.advanceTimersByTime((TOKEN_TTL_SECONDS + 1) * 1000)

      expect(verifyEmbedToken(token, SECRET)).toBeNull()
    })

    it('accepts a token just inside its expiry', () => {
      vi.useFakeTimers()
      const token = createEmbedToken(URL, 'user1', SECRET)

      vi.advanceTimersByTime((TOKEN_TTL_SECONDS - 1) * 1000)

      expect(verifyEmbedToken(token, SECRET)?.embedUrl).toBe(URL)
    })

    it.each([
      ['empty string', ''],
      ['too short to hold iv and tag', 'AAAA'],
      ['not base64url at all', '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'],
      ['plain text of the right length', 'x'.repeat(64)],
    ])('returns null for a malformed token (%s)', (_label, token) => {
      expect(verifyEmbedToken(token, SECRET)).toBeNull()
    })

    it('returns null when no secret is configured', () => {
      const token = createEmbedToken(URL, 'user1', SECRET)
      expect(verifyEmbedToken(token, '')).toBeNull()
    })
  })
})
