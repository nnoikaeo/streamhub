<script setup lang="ts">
/**
 * Admin Permission Management Page
 *
 * Uses shared PermissionsPage component.
 * Admin sees all dashboards and can manage restrictions (Layer 3).
 *
 * Route: /admin/permissions
 */

import PermissionsPage from '~/components/features/PermissionsPage.vue'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Dashboard, Folder } from '~/types/dashboard'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const { user } = useAuth()
const dashboardService = useDashboardService()
const { breadcrumbs } = useAdminBreadcrumbs()
const { folders, fetchFolders, getFolderPath, buildFolderTree } = useAdminFolders()
const { users: allUsers, fetchUsers } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()

// State
const dashboards = ref<Dashboard[]>([])
const isLoading = ref(false)

const folderTree = computed(() => buildFolderTree(folders.value))

// Load dashboards
const loadDashboards = async () => {
  try {
    isLoading.value = true
    if (!user.value) return
    const response = await dashboardService.getDashboards(user.value.uid, user.value.company ?? '', { limit: 100 })
    dashboards.value = response.dashboards
    await fetchUsers()
  } catch (err) {
    console.error('Error loading dashboards:', err)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  let attempts = 0
  while (!user?.value && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  if (user.value?.role !== 'admin') {
    router.push('/dashboard/discover')
  } else {
    await Promise.all([loadDashboards(), fetchFolders(), fetchCompanies(), fetchGroups()])
  }
})
</script>

<template>
  <PermissionsPage
    :dashboards="dashboards"
    :all-users="allUsers"
    :all-groups="groups"
    :all-companies="companies"
    :show-restrictions="true"
    :folder-tree="folderTree"
    :all-folders="folders"
    :breadcrumbs="breadcrumbs"
    :get-folder-path="getFolderPath"
  />
</template>
