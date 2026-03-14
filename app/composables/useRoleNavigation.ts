/**
 * useRoleNavigation Composable
 * Role-based sidebar menu groups for StreamHub
 *
 * Returns menu groups based on user role:
 * - User: Dashboard group only
 * - Moderator: Dashboard + Manage Folders groups
 * - Admin: Dashboard + Admin groups
 *
 * Usage:
 * const { menuGroups, showAdmin } = useRoleNavigation()
 */

import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface SidebarMenuItem {
  path: string
  label: string
  icon: string
}

export interface SidebarMenuGroup {
  id: string
  label: string
  items: SidebarMenuItem[]
}

export function useRoleNavigation() {
  const authStore = useAuthStore()

  const role = computed(() => authStore.user?.role ?? 'user')

  /**
   * Dashboard menu group — visible to ALL roles
   * Primary entry point: View All and Search
   */
  const dashboardMenuGroup = computed<SidebarMenuGroup>(() => ({
    id: 'dashboard',
    label: 'แดชบอร์ด',
    items: [
      { path: '/dashboard/discover', label: 'ดูทั้งหมด', icon: '📊' },
      { path: '/dashboard/discover?mode=search', label: 'ค้นหา', icon: '🔍' },
    ],
  }))

  /**
   * Manage Folders menu group — MODERATOR only
   * Items populated from assigned folders (placeholder for future implementation)
   */
  const manageFoldersMenuGroup = computed<SidebarMenuGroup>(() => ({
    id: 'manage-folders',
    label: 'จัดการโฟลเดอร์',
    items: [],
  }))

  /**
   * Admin menu group — ADMIN only
   * Full admin panel with all management pages
   */
  const adminMenuGroup = computed<SidebarMenuGroup>(() => ({
    id: 'admin',
    label: 'ผู้ดูแลระบบ',
    items: [
      { path: '/admin/overview', label: 'ภาพรวม', icon: '📊' },
      { path: '/admin/users', label: 'ผู้ใช้', icon: '👥' },
      { path: '/admin/explorer', label: 'Explorer', icon: '🗂️' },
      { path: '/admin/companies', label: 'บริษัท', icon: '🏢' },
      { path: '/admin/groups', label: 'กลุ่ม', icon: '👫' },
      { path: '/admin/tags', label: 'แท็ก', icon: '🏷️' },
      { path: '/admin/permissions', label: 'สิทธิ์', icon: '🔐' },
    ],
  }))

  /**
   * All menu groups filtered by role
   */
  const menuGroups = computed<SidebarMenuGroup[]>(() => {
    const groups: SidebarMenuGroup[] = [dashboardMenuGroup.value]

    if (role.value === 'moderator') {
      groups.push(manageFoldersMenuGroup.value)
    }

    if (role.value === 'admin') {
      groups.push(adminMenuGroup.value)
    }

    return groups
  })

  /**
   * Convenience flags for conditional rendering
   */
  const showAdmin = computed(() => role.value === 'admin')
  const showManageFolders = computed(() => role.value === 'moderator')

  return {
    menuGroups,
    showAdmin,
    showManageFolders,
    role,
  }
}
