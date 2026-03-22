/**
 * Generic Admin CRUD Page Composable
 *
 * Eliminates repeated modal state management, CRUD handlers, and toggle logic
 * across all admin pages (users, companies, regions, groups, tags, dashboards, folders).
 *
 * Usage:
 * ```typescript
 * const crud = useAdminCrudPage<Region>({
 *   idKey: 'code',
 *   displayKey: 'name',
 *   createFn: createRegion,
 *   updateFn: updateRegion,
 *   deleteFn: deleteRegion,
 * })
 * ```
 */

import { ref } from 'vue'
import type { Ref } from 'vue'
import { useAppToast } from '~/composables/useToast'

interface CrudPageConfig<T, K extends string | number = string> {
  /** Primary key field name (e.g., 'uid', 'code', 'id') */
  idKey: keyof T
  /** Field for display in logs (e.g., 'email', 'name') */
  displayKey: keyof T
  /** Create function from admin resource composable */
  createFn: (data: Partial<T>) => Promise<T | undefined>
  /** Update function from admin resource composable */
  updateFn: (id: K, data: Partial<T>) => Promise<T | undefined>
  /** Delete function from admin resource composable */
  deleteFn: (id: K) => Promise<boolean | undefined>
  /** Optional callback after successful save */
  onSaved?: () => void
  /** Optional callback after successful delete */
  onDeleted?: () => void
  /** Label for the resource type (e.g., 'ผู้ใช้', 'บริษัท') — used in toast messages */
  resourceLabel?: string
}

export function useAdminCrudPage<T extends Record<string, any>, K extends string | number = string>(config: CrudPageConfig<T, K>) {
  const { idKey, displayKey, createFn, updateFn, deleteFn, onSaved, onDeleted, resourceLabel = 'รายการ' } = config
  const { showToast } = useAppToast()

  // Modal state
  const showFormModal = ref(false)
  const showConfirmDialog = ref(false)
  const showToggleDialog = ref(false)
  const selectedItem = ref<T | null>(null) as Ref<T | null>
  const itemToDelete = ref<T | null>(null) as Ref<T | null>
  const itemToToggle = ref<T | null>(null) as Ref<T | null>
  const formRef = ref<{ submit: () => Promise<void> } | null>(null)

  const getDisplayVal = (item: T | Partial<T>) => String(item[displayKey] || item[idKey] || 'unknown')
  const getId = (item: T) => item[idKey] as K

  // Handlers
  const handleAdd = () => {
    selectedItem.value = null
    showFormModal.value = true
  }

  const handleEdit = (item: T) => {
    selectedItem.value = item
    showFormModal.value = true
  }

  const handleDelete = (item: T) => {
    itemToDelete.value = item
    showConfirmDialog.value = true
  }

  const handleToggleActive = (item: T) => {
    itemToToggle.value = item
    showToggleDialog.value = true
  }

  const confirmToggleActive = async () => {
    if (!itemToToggle.value) return
    const display = getDisplayVal(itemToToggle.value)
    try {
      const newStatus = !(itemToToggle.value as any).isActive
      await updateFn(getId(itemToToggle.value), { isActive: newStatus } as unknown as Partial<T>)
      showToggleDialog.value = false
      itemToToggle.value = null
      showToast(
        newStatus
          ? `เปิดใช้งาน ${display} เรียบร้อยแล้ว`
          : `ปิดใช้งาน ${display} เรียบร้อยแล้ว`
      )
    } catch (error) {
      console.error('Error toggling status:', error)
      showToast(`เกิดข้อผิดพลาดในการเปลี่ยนสถานะ${resourceLabel}`, 'error')
    }
  }

  const handleSave = async (formData: Partial<T>) => {
    const isEdit = !!selectedItem.value
    try {
      if (isEdit) {
        await updateFn(getId(selectedItem.value!), formData)
      } else {
        await createFn(formData)
      }
      showFormModal.value = false
      showToast(isEdit ? `แก้ไข${resourceLabel}เรียบร้อยแล้ว` : `เพิ่ม${resourceLabel}เรียบร้อยแล้ว`)
      onSaved?.()
    } catch (error) {
      console.error('Error saving:', error)
      showToast(`เกิดข้อผิดพลาดในการบันทึก${resourceLabel}`, 'error')
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete.value) return
    const display = getDisplayVal(itemToDelete.value)
    try {
      await deleteFn(getId(itemToDelete.value))
      showConfirmDialog.value = false
      itemToDelete.value = null
      showToast(`ลบ ${display} เรียบร้อยแล้ว`)
      onDeleted?.()
    } catch (error) {
      console.error('Error deleting:', error)
      showToast(`เกิดข้อผิดพลาดในการลบ${resourceLabel}`, 'error')
    }
  }

  return {
    // Modal state
    showFormModal,
    showConfirmDialog,
    showToggleDialog,
    selectedItem,
    itemToDelete,
    itemToToggle,
    formRef,

    // Handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleToggleActive,
    confirmToggleActive,
    handleSave,
    confirmDelete,
  }
}
