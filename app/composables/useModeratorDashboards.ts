/**
 * Moderator Dashboards Composable
 *
 * Provides access to dashboards within folders the current moderator can manage.
 * All CRUD operations enforce folder-level permission before delegating to useAdminDashboards.
 *
 * Usage:
 * const { manageableDashboards, getDashboardsByFolder, fetchDashboards, createDashboard, updateDashboard, deleteDashboard, loading } = useModeratorDashboards()
 */

import { computed } from 'vue'
import { useModeratorFolders } from './useModeratorFolders'
import { useAdminDashboards } from './useAdminDashboards'
import type { Dashboard } from '~/types/dashboard'

export function useModeratorDashboards() {
  const { canManageFolder } = useModeratorFolders()
  const adminDashboards = useAdminDashboards()
  const { dashboards, fetchDashboards, loading } = adminDashboards

  /**
   * All dashboards in folders this moderator can manage
   */
  const manageableDashboards = computed(() => {
    return dashboards.value.filter(d => canManageFolder(d.folderId))
  })

  /**
   * Get dashboards for a specific folder (must be manageable)
   */
  const getDashboardsByFolder = (folderId: string): Dashboard[] => {
    return manageableDashboards.value.filter(d => d.folderId === folderId)
  }

  /**
   * Create a dashboard — only allowed in manageable folders
   */
  const createDashboard = async (data: Partial<Dashboard>): Promise<Dashboard | undefined> => {
    if (!data.folderId || !canManageFolder(data.folderId)) {
      throw new Error('No permission to create dashboard in this folder')
    }
    return adminDashboards.createDashboard(data)
  }

  /**
   * Update a dashboard — only allowed if its folder is manageable
   */
  const updateDashboard = async (id: string, data: Partial<Dashboard>): Promise<Dashboard | undefined> => {
    const dashboard = dashboards.value.find(d => d.id === id)
    if (!dashboard || !canManageFolder(dashboard.folderId)) {
      throw new Error('No permission to update this dashboard')
    }
    return adminDashboards.updateDashboard(id, data)
  }

  /**
   * Delete a dashboard — only allowed if its folder is manageable
   */
  const deleteDashboard = async (id: string): Promise<boolean | undefined> => {
    const dashboard = dashboards.value.find(d => d.id === id)
    if (!dashboard || !canManageFolder(dashboard.folderId)) {
      throw new Error('No permission to delete this dashboard')
    }
    return adminDashboards.deleteDashboard(id)
  }

  return {
    manageableDashboards,
    getDashboardsByFolder,
    fetchDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    loading
  }
}
