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

export function useForm<T extends object>(config: FormConfig<T>) {
  const formData = reactive({ ...config.initialValues }) as T
  const errors = ref({} as Record<keyof T, string | undefined>)
  const loading = ref(false)
  const touched = ref({} as Record<keyof T, boolean>)

  /**
   * Update form field value
   */
  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    formData[field] = value
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
      const fieldErrors = config.validate(formData as T)
      errors.value[field] = fieldErrors[field]
    }
  }

  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    if (!config.validate) return true

    const fieldErrors = config.validate(formData as T)
    errors.value = fieldErrors

    // Mark all fields as touched
    Object.keys(formData).forEach((key) => {
      touched.value[key as keyof T] = true
    })

    return Object.values(fieldErrors).every((error) => !error)
  }

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    Object.assign(formData, { ...config.initialValues })
    errors.value = {} as Record<keyof T, string | undefined>
    touched.value = {} as Record<keyof T, boolean>
  }

  /**
   * Update form data (for populating with existing data)
   */
  const setFormData = (data: Partial<T>) => {
    Object.assign(formData, data)
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
      await config.onSubmit(formData as T)
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
