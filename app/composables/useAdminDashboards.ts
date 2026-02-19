/**
 * Admin Dashboards Management Composable
 * Provides CRUD operations for dashboards resource
 * Handles complex permission structures
 *
 * Usage:
 * const { dashboards, loading, fetchDashboards, createDashboard, updateDashboard, deleteDashboard } = useAdminDashboards()
 */

import type { Dashboard } from '~/types/dashboard'

export function useAdminDashboards() {
  const dashboards = ref<Dashboard[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all dashboards
   */
  const fetchDashboards = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Dashboard[]
        total: number
      }>('/api/mock/dashboards')

      if (response.success) {
        dashboards.value = response.data || []
        console.log(`✅ Loaded ${dashboards.value.length} dashboards`)
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error fetching dashboards:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new dashboard
   */
  const createDashboard = async (dashboardData: Partial<Dashboard>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Dashboard
        action: string
      }>('/api/mock/dashboards', {
        method: 'POST',
        body: {
          id: dashboardData.id || `dash_${Date.now()}`,
          name: dashboardData.name,
          folderId: dashboardData.folderId,
          type: dashboardData.type || 'looker',
          description: dashboardData.description,
          owner: dashboardData.owner,
          lookerDashboardId: dashboardData.lookerDashboardId,
          lookerEmbedUrl: dashboardData.lookerEmbedUrl,
          isArchived: dashboardData.isArchived ?? false,
          createdAt: dashboardData.createdAt || new Date().toISOString(),
          updatedAt: dashboardData.updatedAt || new Date().toISOString(),
          updatedBy: dashboardData.updatedBy,
          access: dashboardData.access || {
            direct: { users: [], roles: [], groups: [] },
            company: {}
          },
          restrictions: dashboardData.restrictions || {
            revoke: [],
            expiry: {}
          },
          ...dashboardData
        }
      })

      if (response.success) {
        console.log(`✅ Dashboard "${dashboardData.name}" created`)
        await fetchDashboards() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error creating dashboard:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing dashboard
   */
  const updateDashboard = async (id: string, updates: Partial<Dashboard>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Dashboard
        action: string
      }>('/api/mock/dashboards', {
        method: 'POST',
        body: {
          id,
          ...updates
        }
      })

      if (response.success) {
        console.log(`✅ Dashboard "${id}" updated`)
        await fetchDashboards() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error updating dashboard:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete dashboard by id
   */
  const deleteDashboard = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        deleted: boolean
        message: string
      }>(`/api/mock/dashboards/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ Dashboard "${id}" deleted`)
        await fetchDashboards() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error deleting dashboard:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get dashboards in a specific folder
   */
  const getDashboardsByFolder = (folderId: string) => {
    return dashboards.value.filter(d => d.folderId === folderId)
  }

  /**
   * Toggle archive status
   */
  const toggleArchive = async (id: string, isArchived: boolean) => {
    return updateDashboard(id, {
      isArchived,
      archivedAt: isArchived ? new Date() : undefined
    })
  }

  return {
    // State (readonly)
    dashboards: readonly(dashboards),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    getDashboardsByFolder,
    toggleArchive,
  }
}
