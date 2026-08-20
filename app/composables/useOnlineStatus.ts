/**
 * Online/offline awareness (BUG-026).
 *
 * The admin pages write to Firestore through the SDK, whose `setDoc` only
 * settles once the server accepts it — and never times out. With the network
 * down the save button therefore sits at "กำลังบันทึก..." forever, saying
 * nothing, until connectivity returns and the queued write goes through. The
 * work is not lost, but nothing on screen says so.
 *
 * This exposes the browser's own view of connectivity so the layout can say it.
 *
 * Usage:
 * const { isOnline } = useOnlineStatus()
 */

import { ref, onMounted, onUnmounted, readonly } from 'vue'

export function useOnlineStatus() {
  // Starts optimistic: during SSR and before the first tick there is no
  // navigator to ask, and claiming "offline" then would flash a false warning.
  const isOnline = ref(true)

  const setOnline = () => { isOnline.value = true }
  const setOffline = () => { isOnline.value = false }

  onMounted(() => {
    isOnline.value = navigator.onLine
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', setOnline)
    window.removeEventListener('offline', setOffline)
  })

  return { isOnline: readonly(isOnline) }
}
