/**
 * Admin Users Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing users
 *
 * Usage:
 * const { items: users, loading, fetch, create, update, delete } = useAdminUsers()
 */

import { useAdminResource } from './useAdminResource'
import type { User } from '~/types/dashboard'

export function useAdminUsers() {
  const resource = useAdminResource<User>({
    resourceName: 'users',
    idKey: 'uid',
    displayKey: 'email',
    idPrefix: 'user_',
    defaults: {
      role: 'user',
      groups: [],
      isActive: true
    }
  })

  // Create backward-compatible aliases for existing page code
  return {
    users: resource.items,
    loading: resource.loading,
    error: resource.error,
    fetchUsers: resource.fetch,
    createUser: resource.create,
    updateUser: resource.update,
    deleteUser: resource.delete,

    // Also expose generic API for flexibility
    ...resource
  }
}
