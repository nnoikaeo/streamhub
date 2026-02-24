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
    defaults: {
      type: 'looker',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      access: {
        direct: { users: [], roles: [], groups: [] },
        company: {}
      },
      restrictions: {
        revoke: [],
        expiry: {}
      }
    },
    extensions: {
      /**
       * Get dashboards in a specific folder
       */
      getDashboardsByFolder: (dashboards, folderId: string) => {
        return dashboards.value.filter((d: Dashboard) => d.folderId === folderId)
      }
    }
  })

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
    dashboards: resource.items,
    loading: resource.loading,
    error: resource.error,
    fetchDashboards: resource.fetch,
    createDashboard: resource.create,
    updateDashboard: resource.update,
    deleteDashboard: resource.delete,
    getDashboardsByFolder: resource.getDashboardsByFolder,
    toggleArchive,

    // Also expose generic API for flexibility
    ...resource
  }
}
