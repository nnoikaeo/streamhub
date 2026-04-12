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
   * Folders accordion is intentionally removed from sidebar per Phase 5 redesign.
   * Folders are now filter dropdowns on /dashboard/discover instead.
   * Admin accesses folder structure via /admin/explorer (has its own left panel).
   *
   * DO NOT change this to true without a sidebar redesign.
   * See: docs/DESIGN/wireframes/sidebar-navigation.md — Section 4
   */
  const showFolders = computed(() => false)

  return {
    showAdmin,
    showFolders,
  }
}
