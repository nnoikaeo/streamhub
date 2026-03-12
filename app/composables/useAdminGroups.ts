/**
 * Admin Groups Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing admin groups
 *
 * Usage:
 * const { items: groups, loading, fetch, create, update, delete } = useAdminGroups()
 */

import { useAdminResource } from './useAdminResource'
import type { AdminGroup } from '~/types/admin'

export function useAdminGroups() {
  const resource = useAdminResource<AdminGroup>({
    resourceName: 'groups',
    idKey: 'id',
    displayKey: 'name',
    defaults: {
      members: [],
      isActive: true
    }
  })

  // Create backward-compatible aliases for existing page code
  return {
    groups: resource.items,
    fetchGroups: resource.fetch,
    createGroup: resource.create,
    updateGroup: resource.update,
    deleteGroup: resource.delete,

    // Also expose generic API for flexibility (includes loading, error, items, fetch, etc.)
    ...resource
  }
}
