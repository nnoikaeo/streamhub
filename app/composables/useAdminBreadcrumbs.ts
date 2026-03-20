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
    '/admin/overview': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'ภาพรวม' },
    ],
    '/admin/users': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'ผู้ใช้' },
    ],
    '/admin/dashboards': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'แดชบอร์ด' },
    ],
    '/admin/explorer': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'Explorer' },
    ],
    '/admin/companies': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'บริษัท' },
    ],
    '/admin/regions': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'กลุ่มธุรกิจ/เขตพื้นที่' },
    ],
    '/admin/groups': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'กลุ่ม' },
    ],
    '/admin/permissions': [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
      { label: 'จัดการสิทธิ์' },
    ],
  }

  /**
   * Computed breadcrumbs based on current route.
   * Explorer sub-routes (/admin/explorer/:folderId) match by prefix.
   * Permissions page adds Explorer when arrived via ?dashboard or ?folder query.
   */
  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (route.path === '/admin/permissions') {
      const cameFromExplorer = !!(route.query.dashboard || route.query.folder)
      if (cameFromExplorer) {
        return [
          { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
          { label: 'Explorer', to: '/admin/explorer' },
          { label: 'จัดการสิทธิ์' },
        ]
      }
    }
    if (route.path in routeMap) return routeMap[route.path]!
    if (route.path.startsWith('/admin/explorer/')) return routeMap['/admin/explorer']
    return [
      { label: 'ผู้ดูแลระบบ', to: '/admin/overview' },
    ]
  })

  return { breadcrumbs }
}
