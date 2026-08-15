/**
 * Admin Dashboards Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing dashboards
 * Handles complex permission structures and dashboard-specific operations
 *
 * Usage:
 * const { items: dashboards, loading, fetch, create, update, delete, getDashboardsByFolder, toggleArchive } = useAdminDashboards()
 */

import { useAdminResource } from './useAdminResource'
import type { Dashboard } from '~/types/dashboard'

export function useAdminDashboards() {
  const resource = useAdminResource<Dashboard>({
    resourceName: 'dashboards',
    idKey: 'id',
    displayKey: 'name',
    idPrefix: 'dash_',
    skipCompanyFilter: true,
    defaults: {
      type: 'looker',
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      access: {
        direct: { users: [], groups: [] },
        company: []
      },
      restrictions: {
        revoke: [],
        expiry: {}
      }
    }
  })

  /** Get dashboards in a specific folder */
  const getDashboardsByFolder = (folderId: string): Dashboard[] =>
    resource.items.value.filter(d => d.folderId === folderId)

  /**
   * Toggle archive status
   * Extended method that uses base update operation
   */
  const toggleArchive = async (id: string, isArchived: boolean) => {
    return resource.update(id, {
      isArchived,
      archivedAt: isArchived ? new Date() : undefined
    } as Partial<Dashboard>)
  }

  // Create backward-compatible aliases for existing page code
  return {
    ...resource,
    dashboards: resource.items,
    loading: resource.loading,
    error: resource.error,
    fetchDashboards: resource.fetch,
    createDashboard: resource.create,
    updateDashboard: resource.update,
    deleteDashboard: resource.delete,
    getDashboardsByFolder,
    toggleArchive,

    // Also expose generic API for flexibility
  }
}
