/**
 * Tests for shared/utils/errors.ts
 *
 * These helpers replaced 71 `catch (e: any)` blocks across app/ and server/,
 * including the auth and permission paths, so the field-precedence rules below
 * are load-bearing: a 403 that stops resolving to 403 silently turns an
 * access-denied screen into a generic failure.
 */

import { describe, it, expect } from 'vitest'
import {
  getErrorStatus,
  getErrorMessage,
  getErrorDataMessage,
  getErrorCode,
  toError,
} from '../../shared/utils/errors'

/** Mirrors what ofetch's FetchError exposes: status, statusCode and response all set. */
const fetchError = (status: number, dataMessage?: string) =>
  Object.assign(new Error(`[GET] failed: ${status}`), {
    status,
    statusCode: status,
    response: { status },
    data: dataMessage ? { message: dataMessage } : undefined,
  })

/** Mirrors h3's createError() output. */
const h3Error = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode, statusMessage: message })

describe('getErrorStatus', () => {
  it('reads h3 statusCode', () => {
    expect(getErrorStatus(h3Error(403, 'Forbidden'))).toBe(403)
  })

  it('reads an ofetch FetchError', () => {
    expect(getErrorStatus(fetchError(403))).toBe(403)
  })

  it('falls back to response.status when statusCode is absent', () => {
    expect(getErrorStatus({ response: { status: 401 } })).toBe(401)
  })

  it('falls back to a plain status', () => {
    expect(getErrorStatus({ status: 500 })).toBe(500)
  })

  it('prefers statusCode over response.status when they disagree', () => {
    expect(getErrorStatus({ statusCode: 403, response: { status: 500 } })).toBe(403)
  })

  it('returns undefined for errors carrying no status', () => {
    expect(getErrorStatus(new Error('boom'))).toBeUndefined()
    expect(getErrorStatus('boom')).toBeUndefined()
    expect(getErrorStatus(null)).toBeUndefined()
    expect(getErrorStatus(undefined)).toBeUndefined()
  })

  it('ignores a non-numeric status', () => {
    expect(getErrorStatus({ statusCode: '403' })).toBeUndefined()
  })
})

describe('getErrorMessage', () => {
  it('reads Error.message', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('reads message off a plain object', () => {
    expect(getErrorMessage({ message: 'boom' })).toBe('boom')
  })

  it('falls back to statusMessage', () => {
    expect(getErrorMessage({ statusMessage: 'Forbidden' })).toBe('Forbidden')
  })

  it('falls back to data.message', () => {
    expect(getErrorMessage({ data: { message: 'no access' } })).toBe('no access')
  })

  it('returns a bare thrown string', () => {
    expect(getErrorMessage('boom')).toBe('boom')
  })

  it('uses the fallback when nothing readable is present', () => {
    expect(getErrorMessage({}, 'Failed to load')).toBe('Failed to load')
    expect(getErrorMessage(null, 'Failed to load')).toBe('Failed to load')
    expect(getErrorMessage(new Error(''), 'Failed to load')).toBe('Failed to load')
  })

  it('always returns a string, unlike a bare error.message', () => {
    expect(typeof getErrorMessage(undefined)).toBe('string')
    expect(typeof getErrorMessage(42)).toBe('string')
  })
})

describe('getErrorDataMessage', () => {
  it('reads the payload message', () => {
    expect(getErrorDataMessage(fetchError(403, 'no access'))).toBe('no access')
  })

  it('returns undefined when there is no payload', () => {
    expect(getErrorDataMessage(fetchError(403))).toBeUndefined()
    expect(getErrorDataMessage(new Error('boom'))).toBeUndefined()
  })
})

describe('getErrorCode', () => {
  it('reads a Firebase auth code', () => {
    const error = Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' })
    expect(getErrorCode(error)).toBe('auth/popup-closed-by-user')
  })

  it('returns undefined when absent or not a string', () => {
    expect(getErrorCode(new Error('boom'))).toBeUndefined()
    expect(getErrorCode({ code: 500 })).toBeUndefined()
  })
})

describe('toError', () => {
  it('passes an Error through unchanged', () => {
    const error = new Error('boom')
    expect(toError(error)).toBe(error)
  })

  it('wraps a non-Error, keeping its message', () => {
    const wrapped = toError({ message: 'boom' })
    expect(wrapped).toBeInstanceOf(Error)
    expect(wrapped.message).toBe('boom')
  })

  it('wraps a bare string', () => {
    expect(toError('boom').message).toBe('boom')
  })
})
