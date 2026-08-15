import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

import { useForm } from '../../app/composables/useForm'
import { createObjectValidator, validators } from '../../app/utils/formValidators'

// Mirrors DashboardForm: a required name + a required folderId picked from a
// select, plus fields with no rules at all.
const dashboardValidate = createObjectValidator({
  name: [
    (value) => validators.required(value, 'ชื่อแดชบอร์ด'),
    validators.minLength(3, 'ชื่อแดชบอร์ด'),
  ],
  folderId: [(value) => validators.required(value, 'โฟลเดอร์')],
})

// initialValues is an object literal (not an interface) on purpose: that is what
// every real form passes, and only a literal type carries the implicit index
// signature createObjectValidator's Record<string, unknown> parameter needs.
function makeForm(validate: ((values: {
  name: string
  folderId: string
  description: string
  tags: string[]
}) => Record<string, string | undefined>) | undefined = dashboardValidate) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const form = useForm({
    initialValues: {
      name: '',
      folderId: '',
      description: '',
      tags: [] as string[],
    },
    validate,
    onSubmit,
  })
  return { ...form, onSubmit }
}

describe('useForm — validateForm', () => {
  it('collects every failing field and returns false', () => {
    const { validateForm, errors, touched } = makeForm()

    expect(validateForm()).toBe(false)
    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')
    expect(errors.value.folderId).toBe('โฟลเดอร์ is required')
    expect(touched.value.name).toBe(true)
    expect(touched.value.description).toBe(true)
  })

  it('returns true once every rule passes', () => {
    const { formData, validateForm, errors } = makeForm()

    formData.name = 'Regional Sales'
    formData.folderId = 'folder_1'

    expect(validateForm()).toBe(true)
    expect(errors.value.name).toBeUndefined()
  })
})

describe('useForm — clearing errors as the user edits', () => {
  // The bug this suite exists for: forms bind `v-model="formData.folderId"`,
  // which assigns straight to the reactive object, so setFieldValue never runs
  // and the red message used to sit there until the next submit.
  it('clears the error when a v-model style direct write fixes the field', async () => {
    const { formData, errors, handleSubmit, onSubmit } = makeForm()

    await handleSubmit()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(errors.value.folderId).toBe('โฟลเดอร์ is required')

    formData.folderId = 'folder_1'
    await nextTick()

    expect(errors.value.folderId).toBeUndefined()
  })

  it('leaves the other fields errors alone', async () => {
    const { formData, errors, validateForm } = makeForm()

    validateForm()
    formData.folderId = 'folder_1'
    await nextTick()

    expect(errors.value.folderId).toBeUndefined()
    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')
  })

  it('keeps an error while the field is still invalid, refreshed to the failing rule', async () => {
    const { formData, errors, validateForm } = makeForm()

    validateForm()
    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')

    formData.name = 'ab'
    await nextTick()

    expect(errors.value.name).toBe('ชื่อแดชบอร์ด must be at least 3 characters')
  })

  it('never raises an error on a field that is not showing one yet', async () => {
    const { formData, errors } = makeForm()

    formData.name = 'ab'
    await nextTick()

    expect(errors.value.name).toBeUndefined()
  })

  it('does not wipe the errors handleSubmit just set', async () => {
    const { errors, handleSubmit, onSubmit } = makeForm()

    await handleSubmit()
    await nextTick()

    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')
    expect(errors.value.folderId).toBe('โฟลเดอร์ is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sees a nested mutation such as pushing a tag', async () => {
    const tagsValidate = (values: { tags: string[] }) => ({
      tags: validators.required(values.tags, 'Tags'),
    })
    const { formData, errors, validateForm } = makeForm(tagsValidate)

    validateForm()
    expect(errors.value.tags).toBe('Tags is required')

    formData.tags.push('tag_1')
    await nextTick()

    expect(errors.value.tags).toBeUndefined()
  })

  it('clears what setFormData fixes when an edit populates the form', async () => {
    const { errors, validateForm, setFormData } = makeForm()

    validateForm()
    setFormData({ name: 'Regional Sales', folderId: 'folder_1' })
    await nextTick()

    expect(errors.value.name).toBeUndefined()
    expect(errors.value.folderId).toBeUndefined()
  })

  it('stays inert on a form with no validator', async () => {
    const { formData, errors } = makeForm(undefined)

    formData.name = 'anything'
    await nextTick()

    expect(errors.value).toEqual({})
  })
})

describe('useForm — the rest of the surface still behaves', () => {
  it('setFieldValue writes the value and clears that field only', () => {
    const { formData, errors, validateForm, setFieldValue } = makeForm()

    validateForm()
    setFieldValue('folderId', 'folder_1')

    expect(formData.folderId).toBe('folder_1')
    expect(errors.value.folderId).toBeUndefined()
    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')
  })

  it('setFieldTouched re-validates on blur without touching other fields', () => {
    const { errors, touched, setFieldTouched } = makeForm()

    setFieldTouched('name')

    expect(touched.value.name).toBe(true)
    expect(errors.value.name).toBe('ชื่อแดชบอร์ด is required')
    expect(errors.value.folderId).toBeUndefined()
  })

  it('resetForm restores the initial values and drops errors and touched', async () => {
    const { formData, errors, touched, validateForm, resetForm } = makeForm()

    formData.name = 'Regional Sales'
    validateForm()
    resetForm()
    await nextTick()

    expect(formData.name).toBe('')
    expect(errors.value).toEqual({})
    expect(touched.value).toEqual({})
  })

  it('submits the form data once every field validates', async () => {
    const { formData, handleSubmit, onSubmit, loading } = makeForm()

    formData.name = 'Regional Sales'
    formData.folderId = 'folder_1'
    await handleSubmit()

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Regional Sales',
      folderId: 'folder_1',
    }))
    expect(loading.value).toBe(false)
  })
})
