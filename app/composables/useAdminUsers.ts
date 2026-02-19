/**
 * Admin Users Management Composable
 * Provides CRUD operations for users resource
 *
 * Usage:
 * const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useAdminUsers()
 */

import type { User } from '~/types/dashboard'

export function useAdminUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all users
   */
  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: User[]
        total: number
      }>('/api/mock/users')

      if (response.success) {
        users.value = response.data || []
        console.log(`✅ Loaded ${users.value.length} users`)
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error fetching users:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new user
   */
  const createUser = async (userData: Partial<User>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: User
        action: string
      }>('/api/mock/users', {
        method: 'POST',
        body: {
          uid: userData.uid || `user_${Date.now()}`,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'user',
          company: userData.company,
          groups: userData.groups || [],
          isActive: userData.isActive ?? true,
          ...userData
        }
      })

      if (response.success) {
        console.log(`✅ User "${userData.email}" created`)
        await fetchUsers() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error creating user:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing user
   */
  const updateUser = async (uid: string, updates: Partial<User>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: User
        action: string
      }>('/api/mock/users', {
        method: 'POST',
        body: {
          uid,
          ...updates
        }
      })

      if (response.success) {
        console.log(`✅ User "${uid}" updated`)
        await fetchUsers() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error updating user:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete user by uid
   */
  const deleteUser = async (uid: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        deleted: boolean
        message: string
      }>(`/api/mock/users/${uid}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ User "${uid}" deleted`)
        await fetchUsers() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error deleting user:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State (readonly)
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
