import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useAdminCrudPage } from '../../app/composables/useAdminCrudPage'
import { ValidationError } from '../../app/composables/useAdminResource'

// Mock useAppToast auto-import at module scope
const showToast = vi.fn()
vi.stubGlobal('useAppToast', () => ({ showToast }))

interface Row {
  id: string
  name: string
}

function makeCrud(overrides: Record<string, unknown> = {}) {
  const deleteFn = vi.fn().mockResolvedValue(true)
  const crud = useAdminCrudPage<Row>({
    idKey: 'id',
    displayKey: 'name',
    createFn: vi.fn().mockResolvedValue(undefined),
    updateFn: vi.fn().mockResolvedValue(undefined),
    deleteFn,
    resourceLabel: 'โฟลเดอร์',
    ...overrides,
  })
  return { crud, deleteFn }
}

beforeEach(() => {
  showToast.mockClear()
})

describe('useAdminCrudPage — canDelete guard', () => {
  it('blocks delete + shows error toast when canDelete returns a message', async () => {
    const msg = 'ไม่สามารถลบโฟลเดอร์ที่มีเนื้อหาได้ กรุณาลบแดชบอร์ดและโฟลเดอร์ย่อยทั้งหมดก่อน'
    const { crud, deleteFn } = makeCrud({ canDelete: () => msg })

    crud.handleDelete({ id: 'f1', name: 'Parent' })
    expect(crud.showConfirmDialog.value).toBe(true)

    await crud.confirmDelete()

    expect(deleteFn).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith(msg, 'error')
    expect(crud.showConfirmDialog.value).toBe(false)
    expect(crud.itemToDelete.value).toBeNull()
  })

  it('allows delete when canDelete returns true', async () => {
    const { crud, deleteFn } = makeCrud({ canDelete: () => true })

    crud.handleDelete({ id: 'f2', name: 'Empty' })
    await crud.confirmDelete()

    expect(deleteFn).toHaveBeenCalledWith('f2')
    expect(showToast).toHaveBeenCalledWith('ลบ Empty เรียบร้อยแล้ว')
    expect(crud.showConfirmDialog.value).toBe(false)
  })

  it('deletes normally when no canDelete guard is configured (backward compat)', async () => {
    const { crud, deleteFn } = makeCrud()

    crud.handleDelete({ id: 'f3', name: 'Loose' })
    await crud.confirmDelete()

    expect(deleteFn).toHaveBeenCalledWith('f3')
  })
})

describe('useAdminCrudPage — handleSave error surfacing', () => {
  it('shows a ValidationError message verbatim and keeps the modal open', async () => {
    const createFn = vi.fn().mockRejectedValue(new ValidationError('รหัสบริษัทซ้ำ'))
    const { crud } = makeCrud({ createFn, resourceLabel: 'บริษัท' })

    crud.handleAdd() // create mode (no selectedItem)
    expect(crud.showFormModal.value).toBe(true)

    await crud.handleSave({ id: 'ACME', name: 'Acme' })

    expect(createFn).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('รหัสบริษัทซ้ำ', 'error')
    // modal stays open so the user can fix the duplicate code
    expect(crud.showFormModal.value).toBe(true)
  })

  it('falls back to a generic message for non-validation errors', async () => {
    const createFn = vi.fn().mockRejectedValue(new Error('network boom'))
    const { crud } = makeCrud({ createFn, resourceLabel: 'บริษัท' })

    crud.handleAdd()
    await crud.handleSave({ id: 'X', name: 'X' })

    expect(showToast).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการบันทึกบริษัท', 'error')
  })

  it('closes the modal and shows success toast on a clean save', async () => {
    const createFn = vi.fn().mockResolvedValue({ id: 'OK', name: 'Ok' })
    const { crud } = makeCrud({ createFn, resourceLabel: 'บริษัท' })

    crud.handleAdd()
    await crud.handleSave({ id: 'OK', name: 'Ok' })

    expect(showToast).toHaveBeenCalledWith('เพิ่มบริษัทเรียบร้อยแล้ว')
    expect(crud.showFormModal.value).toBe(false)
  })
})
