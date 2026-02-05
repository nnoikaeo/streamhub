<template>
  <AppLayout :show-sidebar="false">
    <div class="view-page">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="theme-alert theme-alert--error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <h2>Error Loading Dashboard</h2>
            <p>{{ error }}</p>
          </div>
          <button type="button" class="back-button" @click="handleGoBack">
            ← Go Back
          </button>
        </div>
      </div>

      <!-- Dashboard View -->
      <div v-else-if="dashboard" class="dashboard-view-content">
        <!-- Top Navigation Bar -->
        <DashboardViewHeader
          :dashboard="dashboard"
          :folder-name="currentFolder?.name || 'Untitled'"
          :menu-open="menuOpen"
          :show-manage-permissions="currentUserRole === 'admin'"
          @go-back="handleGoBack"
          @share="openShareDialog"
          @toggle-menu="menuOpen = !menuOpen"
          @edit="handleEditInfo"
          @download="handleDownload"
          @manage-permissions="handleManagePermissions"
          @archive="handleArchive"
        />

        <!-- Main Content with TwoPane -->
        <TwoPaneLayout :sidebar-width="320">
          <!-- Left Pane: Dashboard Info -->
          <template #sidebar>
            <div class="dashboard-sidebar">
              <!-- Dashboard Metadata -->
              <section class="sidebar-section">
                <h3 class="section-title">Dashboard Info</h3>
                <div class="info-group">
                  <label>Type</label>
                  <p class="info-value">
                    <span class="badge" :class="`badge-${dashboard.type}`">
                      {{ dashboard.type }}
                    </span>
                  </p>
                </div>

                <div v-if="dashboard.description" class="info-group">
                  <label>Description</label>
                  <p class="info-value">{{ dashboard.description }}</p>
                </div>

                <div class="info-group">
                  <label>Owner</label>
                  <p class="info-value">{{ ownerName }}</p>
                </div>

                <div class="info-group">
                  <label>Created</label>
                  <p class="info-value">{{ formatDate(dashboard.createdAt) }}</p>
                </div>

                <div class="info-group">
                  <label>Updated</label>
                  <p class="info-value">{{ formatDate(dashboard.updatedAt) }}</p>
                </div>
              </section>

              <!-- Access Control -->
              <section class="sidebar-section">
                <h3 class="section-title">Access Status</h3>
                <div class="access-info">
                  <div class="access-badge" :class="{ 'access-public': isPublic, 'access-restricted': !isPublic }">
                    {{ isPublic ? '🌐 Public' : '🔒 Restricted' }}
                  </div>
                  <p v-if="accessReason" class="access-reason">
                    {{ accessReason }}
                  </p>
                </div>
              </section>

              <!-- Related Dashboards -->
              <section v-if="relatedDashboards.length > 0" class="sidebar-section">
                <h3 class="section-title">Related Dashboards</h3>
                <ul class="related-list">
                  <li v-for="related in relatedDashboards" :key="related.id" class="related-item">
                    <a
                      :href="`/dashboard/view/${related.id}`"
                      class="related-link"
                      @click.prevent="handleViewRelated(related.id)"
                    >
                      {{ related.name }}
                    </a>
                  </li>
                </ul>
              </section>
            </div>
          </template>

          <!-- Right Pane: Looker Dashboard Embed -->
          <div class="dashboard-main">
            <!-- Looker Embed Placeholder -->
            <div v-if="dashboard.type === 'looker' && dashboard.lookerEmbedUrl" class="looker-embed">
              <iframe
                :src="dashboard.lookerEmbedUrl"
                class="embed-iframe"
                title="Looker Dashboard"
                frameborder="0"
                allow="all"
              />
            </div>

            <!-- Custom/External Dashboard Placeholder -->
            <div v-else class="dashboard-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <h2>{{ dashboard.type === 'custom' ? 'Custom Dashboard' : 'External Dashboard' }}</h2>
              <p>
                {{
                  dashboard.type === 'looker'
                    ? 'Looker dashboard embed URL not configured'
                    : 'Dashboard content will be displayed here'
                }}
              </p>
              <div class="placeholder-info">
                <strong>Dashboard ID:</strong> {{ dashboard.id }}
              </div>
            </div>
          </div>
        </TwoPaneLayout>
      </div>
    </div>

    <!-- Quick Share Dialog -->
    <QuickShareDialog
      v-if="shareDialogOpen && dashboard"
      :dashboard="dashboard"
      :current-user-id="currentUserId"
      @close="shareDialogOpen = false"
      @share="handleShare"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Dashboard, Folder, User } from '~/types/dashboard'
import AppLayout from '~/components/layouts/AppLayout.vue'
import TwoPaneLayout from '~/components/compositions/TwoPaneLayout.vue'
import QuickShareDialog from '~/components/features/QuickShareDialog.vue'
import DashboardViewHeader from '~/components/features/DashboardViewHeader.vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

// Router and Auth
const router = useRouter()
const route = useRoute()
const { user } = useAuth()
const dashboardService = useDashboardService()

// State
const dashboard = ref<Dashboard | null>(null)
const currentFolder = ref<Folder | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const menuOpen = ref(false)
const shareDialogOpen = ref(false)
const relatedDashboards = ref<Dashboard[]>([])
const owner = ref<User | null>(null)

// Computed properties
const dashboardId = computed(() => route.params.id as string)
const currentUserId = computed(() => user.value?.uid || '')
const currentUserRole = computed(() => user.value?.role || 'user')

const ownerName = computed(() => {
  if (owner.value) {
    return `${owner.value.name} (${owner.value.email})`
  }
  return 'Unknown'
})

const isPublic = computed(() => {
  if (!dashboard.value) return false
  return dashboard.value.access.public || false
})

const accessReason = computed(() => {
  if (isPublic.value) {
    return 'Public access - Anyone with the link can view'
  }
  return 'Restricted access - Limited to authorized users'
})

// Utility functions
const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Load dashboard data
const loadDashboard = async () => {
  try {
    isLoading.value = true
    error.value = null

    if (!dashboardId.value) {
      error.value = 'Dashboard ID not found'
      return
    }

    // Load dashboard
    const data = await dashboardService.getDashboard(dashboardId.value)
    if (!data) {
      error.value = 'Dashboard not found'
      return
    }

    // Check access
    const hasAccess = await dashboardService.canAccessDashboard(dashboardId.value, currentUserId.value)
    if (!hasAccess) {
      error.value = 'You do not have access to this dashboard'
      return
    }

    dashboard.value = data

    // Load folder info
    const folder = await dashboardService.getFolder(data.folderId)
    if (folder) {
      currentFolder.value = folder
    }

    // Load owner info
    const ownerData = await dashboardService.getUser(data.owner)
    if (ownerData) {
      owner.value = ownerData
    }

    // Load related dashboards in same folder
    const related = await dashboardService.getDashboardsByFolder(data.folderId, currentUserId.value)
    relatedDashboards.value = related.filter((d) => d.id !== dashboardId.value).slice(0, 5)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboard'
    console.error('Error loading dashboard:', err)
  } finally {
    isLoading.value = false
  }
}

// Event handlers
const handleGoBack = async () => {
  if (currentFolder.value) {
    await router.push(`/dashboard/discover?folder=${currentFolder.value.id}`)
  } else {
    await router.push('/dashboard/discover')
  }
}

const handleViewRelated = async (relatedId: string) => {
  await router.push(`/dashboard/view/${relatedId}`)
}

const openShareDialog = () => {
  menuOpen.value = false
  shareDialogOpen.value = true
}

const handleShare = async (data: { grantedUntil?: Date; sendNotification: boolean }) => {
  try {
    if (!dashboard.value) return

    console.log('Share dashboard:', dashboard.value.id, data)
    // API call would go here
    error.value = null
    shareDialogOpen.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to share dashboard'
    console.error('Error sharing dashboard:', err)
  }
}

const handleEditInfo = () => {
  console.log('Edit dashboard info')
  menuOpen.value = false
  // TODO: Implement edit info dialog
}

const handleDownload = () => {
  console.log('Download dashboard')
  menuOpen.value = false
  // TODO: Implement download logic
}

const handleManagePermissions = async () => {
  if (dashboard.value) {
    await router.push(`/admin/permissions?dashboard=${dashboard.value.id}`)
  }
  menuOpen.value = false
}

const handleArchive = () => {
  console.log('Archive dashboard')
  menuOpen.value = false
  // TODO: Implement archive logic with confirmation
}

// Lifecycle
onMounted(async () => {
  await loadDashboard()
})
</script>

<style scoped>
.view-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-light);
}

.loading-container,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state .theme-alert {
  max-width: 600px;
}

.error-state .theme-alert h2 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.error-state .theme-alert p {
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.error-state .theme-alert svg {
  width: 1.5rem;
  height: 1.5rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.back-button:hover {
  opacity: 0.9;
}

.dashboard-view-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  background: white;
  border-bottom: 1px solid var(--color-border-light);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-nav-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.back-nav-button:hover {
  color: var(--color-text-primary);
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.breadcrumb-nav {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-top: 0.25rem;
}

.breadcrumb-sep {
  margin: 0 0.25rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.action-button:hover {
  background: var(--color-bg-light);
  border-color: var(--color-text-secondary);
}

.action-button svg {
  width: 1rem;
  height: 1rem;
}

.menu-button {
  padding: 0.5rem 0.75rem;
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 10;
  margin-top: 0.5rem;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: background 0.2s;
}

.menu-item:hover:not(.danger) {
  background: var(--color-bg-light);
}

.menu-item.danger {
  color: var(--color-error);
}

.menu-item.danger:hover {
  background: var(--color-bg-error);
}

.menu-divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid var(--color-border-light);
}

.dashboard-sidebar {
  padding: 1.5rem 0;
  overflow-y: auto;
  height: 100%;
}

.sidebar-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.sidebar-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  letter-spacing: 0.05em;
}

.info-group {
  margin-bottom: 1rem;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-400);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.5;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-looker {
  background: var(--color-bg-info);
  color: var(--color-primary);
}

.badge-custom {
  background: var(--color-bg-warning);
  color: var(--color-warning);
}

.badge-external {
  background: var(--color-bg-success);
  color: var(--color-success);
}

.access-info {
  padding: 1rem;
  background: var(--color-bg-info);
  border: 1px solid var(--color-border-info);
  border-radius: 0.375rem;
}

.access-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.access-badge.access-public {
  background: var(--color-bg-success);
  color: var(--color-success);
}

.access-badge.access-restricted {
  background: var(--color-bg-error);
  color: var(--color-error);
}

.access-reason {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.related-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.related-item {
  margin-bottom: 0.5rem;
}

.related-item:last-child {
  margin-bottom: 0;
}

.related-link {
  display: block;
  padding: 0.5rem;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.related-link:hover {
  background: var(--color-bg-info);
}

.dashboard-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.looker-embed {
  flex: 1;
  background: white;
  overflow: hidden;
}

.embed-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.dashboard-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  text-align: center;
  padding: 2rem;
  gap: 1rem;
}

.dashboard-placeholder svg {
  width: 5rem;
  height: 5rem;
  color: var(--color-border);
}

.dashboard-placeholder h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.dashboard-placeholder p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.placeholder-info {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .view-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .dashboard-title {
    font-size: 1.25rem;
  }
}
</style>
