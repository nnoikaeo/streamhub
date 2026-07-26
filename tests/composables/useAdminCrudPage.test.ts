import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useAppToast auto-import at module scope
const showToast = vi.fn()
vi.stubGlobal('useAppToast', () => ({ showToast }))

import { useAdminCrudPage } from '../../app/composables/useAdminCrudPage'

interface Row {
  id: string
  name: string
}

function makeCrud(overrides: Record<string, any> = {}) {
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
