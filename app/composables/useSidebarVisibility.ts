/**
 * useSidebarVisibility Composable
 * @deprecated Use useRoleNavigation() instead — it provides full menu group structure.
 *
 * Kept for backward compatibility. Delegates to useRoleNavigation.
 *
 * Usage:
 * const { showAdmin, showFolders } = useSidebarVisibility()
 */

import { computed } from 'vue'
import { useRoleNavigation } from '~/composables/useRoleNavigation'

export function useSidebarVisibility() {
  const { showAdmin } = useRoleNavigation()

  /**
   * Folders accordion is removed from sidebar per Phase 5 redesign.
   * Folders are now used as filters on the discover page instead.
   */
  const showFolders = computed(() => false)

  return {
    showAdmin,
    showFolders,
  }
}
