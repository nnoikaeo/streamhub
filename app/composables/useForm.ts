/**
 * useForm Composable
 *
 * Provides form state management, validation, and submission handling
 * Used by all admin form components for consistency
 */

import { reactive, ref, watch } from 'vue'

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

  // Keep a field's error in step with its value as the user edits.
  //
  // setFieldValue below clears the error too, but every form binds
  // `v-model="formData.x"`, which assigns straight to the reactive object —
  // CompanyForm is setFieldValue's only caller in the repo, so for everyone else
  // that path never runs and the message sat there until the next submit.
  // Watching formData is what makes clearing work for all of them.
  //
  // Re-validating beats diffing the changed keys: a deep watch on a reactive
  // object hands back the same proxy as both new and old value, so a diff would
  // need its own snapshot and would still miss `formData.tags.push(...)`.
  // Only fields already showing an error are touched, so this never raises a
  // complaint about a field the user has not submitted or blurred yet, and it
  // cannot wipe what validateForm just set — formData did not change there, so
  // the watcher does not even fire.
  watch(formData, () => {
    if (!config.validate) return

    const fieldErrors = config.validate(formData as T)
    for (const field of Object.keys(errors.value) as (keyof T)[]) {
      if (errors.value[field]) {
        errors.value[field] = fieldErrors[field]
      }
    }
  }, { deep: true })

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
