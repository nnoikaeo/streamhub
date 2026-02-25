/**
 * useForm Composable
 *
 * Provides form state management, validation, and submission handling
 * Used by all admin form components for consistency
 */

interface FormConfig<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  validate?: (values: T) => Record<keyof T, string | undefined>
}

export function useForm<T extends Record<string, any>>(config: FormConfig<T>) {
  const formData = ref<T>({ ...config.initialValues })
  const errors = ref<Record<keyof T, string | undefined>>({} as any)
  const loading = ref(false)
  const touched = ref<Record<keyof T, boolean>>({} as any)

  /**
   * Update form field value
   */
  const setFieldValue = (field: keyof T, value: any) => {
    formData.value[field] = value
    // Clear error on field change
    if (errors.value[field]) {
      errors.value[field] = undefined
    }
  }

  /**
   * Mark field as touched
   */
  const setFieldTouched = (field: keyof T, value = true) => {
    touched.value[field] = value
    // Re-validate on blur if custom validator provided
    if (config.validate && value) {
      const fieldErrors = config.validate(formData.value)
      errors.value[field] = fieldErrors[field]
    }
  }

  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    if (!config.validate) return true

    const fieldErrors = config.validate(formData.value)
    errors.value = fieldErrors

    // Mark all fields as touched
    Object.keys(formData.value).forEach((key) => {
      touched.value[key as keyof T] = true
    })

    return Object.values(fieldErrors).every((error) => !error)
  }

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    formData.value = { ...config.initialValues }
    errors.value = {} as any
    touched.value = {} as any
  }

  /**
   * Update form data (for populating with existing data)
   */
  const setFormData = (data: Partial<T>) => {
    formData.value = { ...formData.value, ...data }
  }

  /**
   * Submit form
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    loading.value = true
    try {
      await config.onSubmit(formData.value)
    } finally {
      loading.value = false
    }
  }

  return {
    formData,
    errors,
    loading,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
    setFormData,
    handleSubmit,
  }
}
