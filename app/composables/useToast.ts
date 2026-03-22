/**
 * Centralized Toast Notification Composable
 *
 * Provides a global toast notification system that can be used from any component or composable.
 * Uses Nuxt useState() to guarantee a single shared state across the entire app,
 * avoiding module-level ref issues where different imports may get separate instances.
 *
 * Usage:
 * ```typescript
 * const { showToast } = useAppToast()
 * showToast('บันทึกสำเร็จ')
 * showToast('เกิดข้อผิดพลาด', 'error')
 * ```
 */

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

const TOAST_DURATION = 3500
let nextId = 0

export function useAppToast() {
  const toasts = useState<ToastItem[]>('app-toasts', () => [])

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
