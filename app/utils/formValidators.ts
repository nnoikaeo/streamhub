/**
 * Form Validators Utility
 *
 * Reusable validation functions for form fields
 */

/**
 * A field validator: takes whatever the form holds for that field and returns
 * an error message, or `undefined` when the value is acceptable.
 *
 * The parameter is `unknown` because form state is heterogeneous — a field can
 * hold a string, a number, an array of ids, or nothing at all — and every
 * validator below decides for itself what it accepts.
 */
export type Validator = (value: unknown) => string | undefined

/** Empty means unset: '', null or undefined. Everything else has a value. */
const isEmpty = (value: unknown): boolean =>
  value === '' || value === null || value === undefined

export const validators = {
  /**
   * Check if value is required (not empty)
   */
  required: (value: unknown, fieldName: string): string | undefined => {
    if (isEmpty(value)) {
      return `${fieldName} is required`
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${fieldName} is required`
    }
    return undefined
  },

  /**
   * Check if value is valid email
   */
  email: (value: unknown): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!isEmpty(value) && !emailRegex.test(String(value))) {
      return 'Invalid email format'
    }
    return undefined
  },

  /**
   * Check minimum length
   */
  minLength: (minLength: number, fieldName: string): Validator => (value) => {
    if (value && String(value).length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`
    }
    return undefined
  },

  /**
   * Check maximum length
   */
  maxLength: (maxLength: number, fieldName: string): Validator => (value) => {
    if (value && String(value).length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters`
    }
    return undefined
  },

  /**
   * Check if value is numeric
   */
  numeric: (value: unknown): string | undefined => {
    if (value && isNaN(Number(value))) {
      return 'Value must be numeric'
    }
    return undefined
  },

  /**
   * Check if value is alphanumeric
   */
  alphanumeric: (value: unknown): string | undefined => {
    const alphanumericRegex = /^[a-zA-Z0-9_-]+$/
    if (!isEmpty(value) && !alphanumericRegex.test(String(value))) {
      return 'Value must be alphanumeric (letters, numbers, hyphens, underscores only)'
    }
    return undefined
  },

  /**
   * Custom validator using function
   */
  custom: (fn: (value: unknown) => boolean, message: string): Validator => (value) => {
    if (value && !fn(value)) {
      return message
    }
    return undefined
  },
}

/**
 * Compose multiple validators
 */
export function composeValidators(...validatorFns: Validator[]): Validator {
  return (value) => {
    for (const validator of validatorFns) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}

/**
 * Create object validators
 * Example:
 * const validate = createObjectValidator({
 *   email: [validators.required('Email'), validators.email],
 *   name: [validators.required('Name'), validators.minLength(2, 'Name')],
 * })
 */
export function createObjectValidator(
  validatorMap: Record<string, Validator[]>
): (obj: Record<string, unknown>) => Record<string, string | undefined> {
  return (obj) => {
    const errors: Record<string, string | undefined> = {}

    for (const [field, validators] of Object.entries(validatorMap)) {
      for (const validator of validators) {
        const error = validator(obj[field])
        if (error) {
          errors[field] = error
          break
        }
      }
    }

    return errors
  }
}
