/**
 * Form Validators Utility
 *
 * Reusable validation functions for form fields
 */

export const validators = {
  /**
   * Check if value is required (not empty)
   */
  required: (value: any, fieldName: string): string | undefined => {
    if (value === '' || value === null || value === undefined) {
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
  email: (value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return 'Invalid email format'
    }
    return undefined
  },

  /**
   * Check minimum length
   */
  minLength: (minLength: number, fieldName: string) => (value: any): string | undefined => {
    if (value && String(value).length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`
    }
    return undefined
  },

  /**
   * Check maximum length
   */
  maxLength: (maxLength: number, fieldName: string) => (value: any): string | undefined => {
    if (value && String(value).length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters`
    }
    return undefined
  },

  /**
   * Check if value is numeric
   */
  numeric: (value: any): string | undefined => {
    if (value && isNaN(Number(value))) {
      return 'Value must be numeric'
    }
    return undefined
  },

  /**
   * Check if value is alphanumeric
   */
  alphanumeric: (value: string): string | undefined => {
    const alphanumericRegex = /^[a-zA-Z0-9_-]+$/
    if (value && !alphanumericRegex.test(value)) {
      return 'Value must be alphanumeric (letters, numbers, hyphens, underscores only)'
    }
    return undefined
  },

  /**
   * Custom validator using function
   */
  custom: (fn: (value: any) => boolean, message: string) => (value: any): string | undefined => {
    if (value && !fn(value)) {
      return message
    }
    return undefined
  },
}

/**
 * Compose multiple validators
 */
export function composeValidators(
  ...validatorFns: Array<(value: any) => string | undefined>
): (value: any) => string | undefined {
  return (value: any) => {
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
  validatorMap: Record<string, Array<(value: any) => string | undefined>>
): (obj: any) => Record<string, string | undefined> {
  return (obj: any) => {
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
