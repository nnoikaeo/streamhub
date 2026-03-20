<script setup lang="ts">
/**
 * Moderator Permission Management Page
 *
 * Uses shared PermissionsPage component.
 * Moderator sees only manageable dashboards. Restrictions (Layer 3) hidden.
 *
 * Route: /manage/permissions
 */

import PermissionsPage from '~/components/features/PermissionsPage.vue'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import { useModeratorDashboards } from '~/composables/useModeratorDashboards'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  middleware: ['auth'],
  layout: 'default',
})

const router = useRouter()
const { user } = useAuth()

const { assignedFolderTree, allFolders, fetchFolders: fetchModFolders, canManageFolder } = useModeratorFolders()
const { manageableDashboards, fetchDashboards } = useModeratorDashboards()
const { users: allUsers, fetchUsers } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()

const breadcrumbs = computed(() => {
  const cameFromExplorer = !!(route.query.dashboard || route.query.folder)
  if (cameFromExplorer) {
    return [
      { label: 'จัดการ', to: '/manage/explorer' },
      { label: 'Explorer', to: '/manage/explorer' },
      { label: 'สิทธิ์' },
    ]
  }
  return [
    { label: 'จัดการ', to: '/manage/explorer' },
    { label: 'สิทธิ์' },
  ]
})

// Lifecycle
onMounted(async () => {
  let attempts = 0
  while (!user?.value && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  if (user.value?.role !== 'moderator') {
    router.push('/dashboard/discover')
    return
  }

  try {
    await Promise.all([
      fetchModFolders(),
      fetchDashboards(),
      fetchUsers(),
      fetchCompanies(),
      fetchGroups(),
    ])
  } catch (err) {
    console.error('Error loading data:', err)
  }
})
</script>

<template>
  <PermissionsPage
    :dashboards="manageableDashboards"
    :all-users="allUsers"
    :all-groups="groups"
    :all-companies="companies"
    :show-restrictions="false"
    :folder-tree="assignedFolderTree"
    :all-folders="allFolders"
    :breadcrumbs="breadcrumbs"
    :can-manage-folder="canManageFolder"
  />
</template>
