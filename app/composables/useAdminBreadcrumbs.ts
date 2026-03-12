/**
 * useAdminBreadcrumbs Composable
 * Auto-generates breadcrumb items based on current route in admin section
 *
 * Usage:
 * const { breadcrumbs } = useAdminBreadcrumbs()
 * <PageLayout :breadcrumbs="breadcrumbs" ... />
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface BreadcrumbItem {
  label: string
  to?: string
}

export function useAdminBreadcrumbs() {
  const route = useRoute()

  /**
   * Map of admin routes to breadcrumb items
   * Each route returns an array of breadcrumb items
   */
  const routeMap: Record<string, BreadcrumbItem[]> = {
    '/admin/overview': [{ label: 'ภาพรวม' }],
    '/admin/users': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'ผู้ใช้' },
    ],
    '/admin/dashboards': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'แดชบอร์ด' },
    ],
    '/admin/folders': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'โฟลเดอร์' },
    ],
    '/admin/companies': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'บริษัท' },
    ],
    '/admin/groups': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'กลุ่ม' },
    ],
    '/admin/permissions': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'สิทธิ์' },
    ],
  }

  /**
   * Computed breadcrumbs based on current route
   * Falls back to a simple 'Admin' breadcrumb if route not found
   */
  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    return routeMap[route.path] ?? [{ label: 'Admin' }]
  })

  return { breadcrumbs }
}
