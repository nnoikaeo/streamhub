/**
 * Admin Groups Management Composable
 * Provides CRUD operations for groups resource
 *
 * Usage:
 * const { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup } = useAdminGroups()
 */

interface AdminGroup {
  id: string
  name: string
  members: string[]
  description?: string
}

export function useAdminGroups() {
  const groups = ref<AdminGroup[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all groups
   */
  const fetchGroups = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: AdminGroup[]
        total: number
      }>('/api/mock/groups')

      if (response.success) {
        groups.value = response.data || []
        console.log(`✅ Loaded ${groups.value.length} groups`)
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error fetching groups:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new group
   */
  const createGroup = async (groupData: Partial<AdminGroup>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: AdminGroup
        action: string
      }>('/api/mock/groups', {
        method: 'POST',
        body: {
          id: groupData.id,
          name: groupData.name,
          members: groupData.members || [],
          description: groupData.description,
          ...groupData
        }
      })

      if (response.success) {
        console.log(`✅ Group "${groupData.id}" created`)
        await fetchGroups() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error creating group:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing group
   */
  const updateGroup = async (id: string, updates: Partial<AdminGroup>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: AdminGroup
        action: string
      }>('/api/mock/groups', {
        method: 'POST',
        body: {
          id,
          ...updates
        }
      })

      if (response.success) {
        console.log(`✅ Group "${id}" updated`)
        await fetchGroups() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error updating group:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete group by id
   */
  const deleteGroup = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        deleted: boolean
        message: string
      }>(`/api/mock/groups/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ Group "${id}" deleted`)
        await fetchGroups() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error deleting group:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State (readonly)
    groups: readonly(groups),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  }
}
