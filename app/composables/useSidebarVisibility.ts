/**
 * useSidebarVisibility Composable
 * Determines sidebar section visibility based on user role
 *
 * Role-based approach ensures consistent sidebar across all pages
 * - Admin: sees Admin Panel + Folders accordion
 * - Moderator: sees Folders accordion only
 * - User: sees neither (basic dashboard)
 *
 * Usage:
 * const { showAdmin, showFolders } = useSidebarVisibility()
 */

import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useSidebarVisibility() {
  const authStore = useAuthStore()

  /**
   * Admin Panel visibility
   * Only admin users can see admin menu (Users, Dashboards, Folders, etc.)
   */
  const showAdmin = computed(() => {
    return authStore.user?.role === 'admin'
  })

  /**
   * Folders accordion visibility
   * Admin, Moderator & regular users can see folders
   */
  const showFolders = computed(() => {
    const role = authStore.user?.role
    return ['admin', 'moderator', 'user'].includes(role)
  })

  return {
    showAdmin,
    showFolders
  }
}
