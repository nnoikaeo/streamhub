/**
 * Centralized Toast Notification Composable
 *
 * Provides a global toast notification system that can be used from any component or composable.
 * Uses a shared reactive state so toasts triggered from composables (e.g., useAdminCrudPage)
 * are rendered by the global AppToast component in app.vue.
 *
 * Usage:
 * ```typescript
 * const { showToast } = useToast()
 * showToast('บันทึกสำเร็จ')
 * showToast('เกิดข้อผิดพลาด', 'error')
 * ```
 */

import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

const TOAST_DURATION = 3500

// Global shared state (singleton across all useToast() calls)
const toasts = ref<ToastItem[]>([])
let nextId = 0

export function useAppToast() {
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = nextId++
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, TOAST_DURATION)
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    dismissToast,
  }
}
