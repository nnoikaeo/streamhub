/**
 * Tests for app/utils/formValidators.ts
 *
 * The validators moved from `(value: any)` to a shared `Validator` type taking
 * `unknown`, which meant `email` and `alphanumeric` — previously typed as
 * `(value: string)` but reachable with anything — had to stringify explicitly.
 * These lock in that the empty-vs-invalid boundary did not shift.
 */

import { describe, it, expect } from 'vitest'
import { validators, composeValidators, createObjectValidator } from '../../app/utils/formValidators'

describe('validators.required', () => {
  it('rejects empty values', () => {
    expect(validators.required('', 'Name')).toBe('Name is required')
    expect(validators.required(null, 'Name')).toBe('Name is required')
    expect(validators.required(undefined, 'Name')).toBe('Name is required')
    expect(validators.required([], 'Name')).toBe('Name is required')
  })

  it('accepts anything else, including falsy non-empties', () => {
    expect(validators.required('a', 'Name')).toBeUndefined()
    expect(validators.required(0, 'Name')).toBeUndefined()
    expect(validators.required(false, 'Name')).toBeUndefined()
    expect(validators.required(['a'], 'Name')).toBeUndefined()
  })
})

describe('validators.email', () => {
  it('accepts a valid address', () => {
    expect(validators.email('a@b.co')).toBeUndefined()
  })

  it('rejects a malformed address', () => {
    expect(validators.email('not-an-email')).toBe('Invalid email format')
  })

  it('treats empty as not-yet-filled, leaving that to required', () => {
    expect(validators.email('')).toBeUndefined()
    expect(validators.email(null)).toBeUndefined()
    expect(validators.email(undefined)).toBeUndefined()
  })

  it('stringifies a non-string before matching', () => {
    expect(validators.email(42)).toBe('Invalid email format')
  })
})

describe('validators.minLength / maxLength', () => {
  it('measures the stringified value', () => {
    expect(validators.minLength(3, 'Code')('ab')).toBe('Code must be at least 3 characters')
    expect(validators.minLength(3, 'Code')('abc')).toBeUndefined()
    expect(validators.maxLength(3, 'Code')('abcd')).toBe('Code must not exceed 3 characters')
    expect(validators.maxLength(3, 'Code')('abc')).toBeUndefined()
  })

  it('skips empty values', () => {
    expect(validators.minLength(3, 'Code')('')).toBeUndefined()
    expect(validators.minLength(3, 'Code')(undefined)).toBeUndefined()
  })
})

describe('validators.numeric', () => {
  it('accepts numbers and numeric strings', () => {
    expect(validators.numeric(42)).toBeUndefined()
    expect(validators.numeric('42')).toBeUndefined()
  })

  it('rejects non-numeric strings', () => {
    expect(validators.numeric('abc')).toBe('Value must be numeric')
  })
})

describe('validators.alphanumeric', () => {
  it('accepts letters, digits, hyphens and underscores', () => {
    expect(validators.alphanumeric('a-b_1')).toBeUndefined()
  })

  it('rejects anything else', () => {
    expect(validators.alphanumeric('a b')).toBe('Value must be alphanumeric (letters, numbers, hyphens, underscores only)')
  })

  it('skips empty values', () => {
    expect(validators.alphanumeric('')).toBeUndefined()
  })
})

describe('validators.custom', () => {
  it('reports the given message when the predicate fails', () => {
    const noSpaces = validators.custom(v => !String(v).includes(' '), 'no spaces allowed')
    expect(noSpaces('a b')).toBe('no spaces allowed')
    expect(noSpaces('ab')).toBeUndefined()
  })
})

describe('composeValidators', () => {
  it('returns the first error and stops', () => {
    const validate = composeValidators(
      v => validators.required(v, 'Code'),
      validators.minLength(3, 'Code'),
    )
    expect(validate('')).toBe('Code is required')
    expect(validate('ab')).toBe('Code must be at least 3 characters')
    expect(validate('abc')).toBeUndefined()
  })
})

describe('createObjectValidator', () => {
  it('collects one error per field', () => {
    const validate = createObjectValidator({
      code: [v => validators.required(v, 'Code'), validators.minLength(3, 'Code')],
      email: [validators.email],
    })

    expect(validate({ code: 'abc', email: 'a@b.co' })).toEqual({})
    expect(validate({ code: 'ab', email: 'nope' })).toEqual({
      code: 'Code must be at least 3 characters',
      email: 'Invalid email format',
    })
  })

  it('reports a missing field as required', () => {
    const validate = createObjectValidator({ code: [v => validators.required(v, 'Code')] })
    expect(validate({})).toEqual({ code: 'Code is required' })
  })
})
