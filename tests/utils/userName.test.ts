/**
 * Tests for shared/utils/userName.ts
 *
 * Users carry firstName / lastName (both optional) instead of one `name`
 * string. Every reader goes through these helpers, so a user with no name
 * still shows something and nobody joins the two parts by hand.
 */

import { describe, it, expect } from 'vitest'
import { fullName, userLabel, splitName, nameAtAcceptance, cleanNamePart, NAME_PART_MAX } from '../../shared/utils/userName'

describe('fullName', () => {
  it('joins first and last name with one space', () => {
    expect(fullName({ firstName: 'สมชาย', lastName: 'ใจดี' })).toBe('สมชาย ใจดี')
  })

  it('uses whichever part exists', () => {
    expect(fullName({ firstName: 'สมชาย' })).toBe('สมชาย')
    expect(fullName({ lastName: 'ใจดี' })).toBe('ใจดี')
  })

  it('is empty for no name, blank parts or no user', () => {
    expect(fullName({ firstName: '  ', lastName: '' })).toBe('')
    expect(fullName({ email: 'a@gmail.com' })).toBe('')
    expect(fullName(null)).toBe('')
    expect(fullName(undefined)).toBe('')
  })
})

describe('userLabel', () => {
  it('is the full name when there is one', () => {
    expect(userLabel({ firstName: 'สมชาย', lastName: 'ใจดี', email: 'a@gmail.com' })).toBe('สมชาย ใจดี')
  })

  it('falls back to the email', () => {
    expect(userLabel({ email: 'a@gmail.com' })).toBe('a@gmail.com')
  })

  it('is empty when there is neither', () => {
    expect(userLabel({})).toBe('')
    expect(userLabel(undefined)).toBe('')
  })
})

describe('splitName', () => {
  it('splits at the first space', () => {
    expect(splitName('Nopphol Noikaeo')).toEqual({ firstName: 'Nopphol', lastName: 'Noikaeo' })
  })

  it('keeps everything after the first space as the last name', () => {
    expect(splitName('Maria de la Cruz')).toEqual({ firstName: 'Maria', lastName: 'de la Cruz' })
  })

  it('collapses extra whitespace', () => {
    expect(splitName('  สมชาย    ใจดี ')).toEqual({ firstName: 'สมชาย', lastName: 'ใจดี' })
  })

  it('puts a single word in the first name', () => {
    expect(splitName('Hotline')).toEqual({ firstName: 'Hotline', lastName: '' })
  })

  it('gives two empty parts for nothing', () => {
    expect(splitName('')).toEqual({ firstName: '', lastName: '' })
    expect(splitName(null)).toEqual({ firstName: '', lastName: '' })
  })
})

describe('nameAtAcceptance', () => {
  it('keeps the name the admin typed over the Google name', () => {
    expect(nameAtAcceptance({ firstName: ' สมชาย ', lastName: 'ใจดี' }, 'Somchai J'))
      .toEqual({ firstName: 'สมชาย', lastName: 'ใจดี' })
  })

  it('keeps a typed first name alone rather than mixing in the Google name', () => {
    expect(nameAtAcceptance({ firstName: 'สมชาย' }, 'Somchai Jaidee'))
      .toEqual({ firstName: 'สมชาย', lastName: '' })
  })

  it('falls back to the Google display name, split', () => {
    expect(nameAtAcceptance({}, 'Somchai Jaidee')).toEqual({ firstName: 'Somchai', lastName: 'Jaidee' })
  })

  it('gives empty parts when neither exists', () => {
    expect(nameAtAcceptance({ firstName: '', lastName: '  ' }, null)).toEqual({ firstName: '', lastName: '' })
  })
})

describe('cleanNamePart', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanNamePart('  ใจ   ดี ')).toBe('ใจ ดี')
  })

  it('reads anything that is not a string as empty', () => {
    expect(cleanNamePart(undefined)).toBe('')
    expect(cleanNamePart(42)).toBe('')
    expect(cleanNamePart({ first: 'x' })).toBe('')
  })

  it('caps the length', () => {
    expect(cleanNamePart('ก'.repeat(500))).toHaveLength(NAME_PART_MAX)
  })
})
