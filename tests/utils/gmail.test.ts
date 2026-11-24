/**
 * Tests for shared/utils/gmail.ts
 *
 * Invitations go to @gmail.com accounts only. The forms show the suffix as
 * fixed text, and the server checks again with the same helpers.
 */

import { describe, it, expect } from 'vitest'
import { toGmailAddress, isGmailAddress } from '../../shared/utils/gmail'

describe('toGmailAddress', () => {
  it('adds @gmail.com to a bare username', () => {
    expect(toGmailAddress('somchai.j')).toBe('somchai.j@gmail.com')
  })

  it('accepts a full Gmail address in any case and trims it', () => {
    expect(toGmailAddress('  SomChai.J@Gmail.com ')).toBe('somchai.j@gmail.com')
  })

  it('refuses another domain', () => {
    expect(toGmailAddress('somchai@company.co.th')).toBeNull()
    expect(toGmailAddress('somchai@googlemail.com')).toBeNull()
    expect(toGmailAddress('somchai@gmail.com.evil.io')).toBeNull()
  })

  it('refuses characters a Gmail username cannot hold', () => {
    expect(toGmailAddress('som chai')).toBeNull()
    expect(toGmailAddress('somchai!')).toBeNull()
    expect(toGmailAddress('.somchai')).toBeNull()
    expect(toGmailAddress('a@b@gmail.com')).toBeNull()
  })

  it('accepts a +tag, which Gmail delivers', () => {
    expect(toGmailAddress('somchai+qa@gmail.com')).toBe('somchai+qa@gmail.com')
  })

  it('is null for nothing', () => {
    expect(toGmailAddress('')).toBeNull()
    expect(toGmailAddress('   ')).toBeNull()
    expect(toGmailAddress(null)).toBeNull()
    expect(toGmailAddress('@gmail.com')).toBeNull()
  })
})

describe('isGmailAddress', () => {
  it('is true for a full Gmail address only', () => {
    expect(isGmailAddress('somchai@gmail.com')).toBe(true)
    expect(isGmailAddress('SOMCHAI@GMAIL.COM')).toBe(true)
  })

  it('is false for a bare username — the server wants the whole address', () => {
    expect(isGmailAddress('somchai')).toBe(false)
  })

  it('is false for another domain or nothing', () => {
    expect(isGmailAddress('somchai@hotmail.com')).toBe(false)
    expect(isGmailAddress(undefined)).toBe(false)
  })
})
