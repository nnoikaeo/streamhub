<template>
  <PageLayout
    :breadcrumbs="[{ label: 'หน้าแรก' }]"
    :folders="mockFolders"
    :allow-search="true"
    :allow-create="canCreateFolder"
    @select-folder="handleSelectFolder"
    @create-folder="handleCreateFolder"
  >
    <!-- Note: showFolders & showAdmin now determined by user role (role-based) -->
    <!-- Main Content -->
    <div class="dashboard-main-content">
      
      <!-- Page Content -->
      <div class="dashboard-page">
          <div class="dashboard-header">
            <h1 class="dashboard-title">Welcome, {{ user?.displayName || 'User' }}</h1>
            <p class="dashboard-subtitle">{{ user?.email }}</p>
          </div>

    <!-- All Users Section -->
    <section class="dashboard-section">
      <h2 class="section-title">My Workspace</h2>
      
      <div class="stats-grid">
        <DashboardStatCard
          title="My Dashboards"
          :count="myDashboardsCount"
          icon="📊"
          link="/dashboard/discover?filter=my"
        />
        <DashboardStatCard
          title="Shared with Me"
          :count="sharedDashboardsCount"
          icon="🤝"
          link="/dashboard/discover?filter=shared"
        />
        <DashboardStatCard
          title="Favorites"
          :count="favoritesCount"
          icon="⭐"
          link="/dashboard/discover?filter=favorites"
        />
      </div>

      <div class="content-grid">
        <DashboardRecentDashboards :dashboards="recentDashboards" />
        <DashboardQuickActions
          :can-create="isModerator || isAdmin"
          :can-share="isModerator || isAdmin"
          :can-invite="isAdmin"
          @view-dashboards="navigateTo('/dashboard/discover')"
          @create-dashboard="navigateTo('/dashboard/create')"
          @share-dashboard="handleShare"
          @invite-user="navigateTo('/admin/users?action=invite')"
        />
      </div>
    </section>

    <!-- Moderator + Admin Section -->
    <section v-if="isModerator || isAdmin" class="dashboard-section">
      <h2 class="section-title">Company Overview</h2>
      
      <div class="stats-grid">
        <DashboardStatCard
          title="Company Dashboards"
          :count="companyDashboardsCount"
          icon="🏢"
          link="/dashboard/discover?scope=company"
        />
        <DashboardStatCard
          title="Folders"
          :count="foldersCount"
          icon="📁"
          link="/admin/folders"
        />
        <DashboardStatCard
          title="Companies"
          :count="companiesCount"
          icon="🏢"
          link="/admin/companies"
        />
      </div>
    </section>

    <!-- Admin Only Section -->
    <section v-if="isAdmin" class="dashboard-section">
      <h2 class="section-title">Administration</h2>
      
      <div class="stats-grid">
        <DashboardStatCard
          title="Total Users"
          :count="totalUsersCount"
          icon="👥"
          link="/admin/users"
        />
        <DashboardStatCard
          title="Groups"
          :count="groupsCount"
          icon="👥"
          link="/admin/groups"
        />
        <DashboardStatCard
          title="Dashboards"
          :count="dashboardsCount"
          icon="📊"
          link="/admin/dashboards"
        />
      </div>
    </section>
        </div>
      </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { mockDashboards, mockFolders, mockUsers, mockCompanies, mockGroups } from '~/composables/useMockData'
import type { Folder } from '~/types/dashboard'
import PageLayout from '~/components/compositions/PageLayout.vue'
import { usePermissionsStore } from '~/stores/permissions'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const { user } = useAuth()
const permissionsStore = usePermissionsStore()

// Permissions
const canCreateFolder = computed(() => permissionsStore.can('canCreateFolder'))

// Role checks
const isAdmin = computed(() => user.value?.role === 'admin')
const isModerator = computed(() => user.value?.role === 'moderator')

// Stats - using mock data for now
const myDashboardsCount = computed(() => {
  return mockDashboards.filter(d => d.owner === user.value?.uid).length
})

const sharedDashboardsCount = computed(() => {
  return mockDashboards.filter(d => 
    d.owner !== user.value?.uid && 
    d.access?.direct?.users?.includes(user.value?.uid || '')
  ).length
})

const favoritesCount = computed(() => {
  // TODO: Implement favorites functionality
  return 0
})

const companyDashboardsCount = computed(() => {
  // All dashboards in same company
  return mockDashboards.length
})

const foldersCount = computed(() => mockFolders.length)

const totalUsersCount = computed(() => mockUsers.length)

const dashboardsCount = computed(() => mockDashboards.length)

const companiesCount = computed(() => mockCompanies.length)

const groupsCount = computed(() => mockGroups.length)

// Recent dashboards - top 5 most recently updated
const recentDashboards = computed(() => {
  return mockDashboards
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(d => ({
      id: d.id,
      name: d.name,
      lastAccessed: d.updatedAt
    }))
})

// Actions
const handleSelectFolder = (folder: Folder) => {
  // Navigate to discover page with selected folder
  navigateTo(`/dashboard/discover?folder=${folder.id}`)
}

const handleCreateFolder = () => {
  // TODO: Implement create folder
  alert('Create folder functionality coming soon!')
}

const handleShare = () => {
  // TODO: Implement share functionality
  alert('Share functionality coming soon!')
}
</script>

<style scoped>
.dashboard-main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-xl);
  height: 100%;
}

.dashboard-page {
  width: 100%;
}

.dashboard-header {
  margin-bottom: var(--spacing-xl);
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.dashboard-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border-light);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
