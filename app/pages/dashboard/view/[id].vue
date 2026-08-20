<template>
  <AppLayout :show-sidebar="false">
    <div class="view-page">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>

      <!-- Access Denied State -->
      <div v-else-if="accessDenied" class="error-state">
        <div class="theme-alert theme-alert--error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <h2>เข้าถึงรายงานไม่ได้</h2>
            <p>บัญชีปัจจุบันของคุณ {{ user?.email }} ไม่สามารถเข้าถึงรายงานนี้ หรือรายงานไม่มีอยู่</p>
          </div>
          <button type="button" class="back-button" @click="handleGoBack">
            ← ย้อนกลับ
          </button>
        </div>
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
            <h2>เกิดข้อผิดพลาดในการโหลดรายงาน</h2>
            <p>{{ error }}</p>
          </div>
          <button type="button" class="back-button" @click="handleGoBack">
            ← ย้อนกลับ
          </button>
        </div>
      </div>

      <!-- Dashboard View -->
      <div
        v-else-if="dashboard"
        class="dashboard-view-content is-fullscreen"
        :class="{ 'is-printing': isPrinting, 'is-immersive': immersive }"
      >
        <!-- Immersive mode hides the header, taking the button that got you here
             with it. This is the way back, and the only one on a phone: Esc
             needs a keyboard, and there is no browser chrome to leave when the
             device has no native fullscreen. -->
        <button
          v-if="immersive"
          type="button"
          class="action-button immersive-exit"
          title="ออกจากโหมดเต็มจอ"
          aria-label="ออกจากโหมดเต็มจอ"
          @click="toggleFullscreen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        <!-- Top Navigation Bar -->
        <DashboardViewHeader
          :dashboard="dashboard"
          :folder-name="currentFolder?.name || 'Untitled'"
          :menu-open="menuOpen"
          @go-back="handleGoBack"
          @toggle-menu="menuOpen = !menuOpen"
          @edit="handleEditInfo"
          @download="handleDownload"
          @archive="handleArchive"
          @unarchive="handleUnarchive"
        >
          <template #actions>
            <button
              v-if="currentUserRole === 'admin'"
              type="button"
              class="action-button toggle-sidebar-button"
              :title="showInfoSidebar ? 'ซ่อนข้อมูลแดชบอร์ด' : 'แสดงข้อมูลแดชบอร์ด'"
              :aria-label="showInfoSidebar ? 'ซ่อนข้อมูลแดชบอร์ด' : 'แสดงข้อมูลแดชบอร์ด'"
              @click="showInfoSidebar = !showInfoSidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <span class="action-label">{{ showInfoSidebar ? 'ซ่อนข้อมูล' : 'แสดงข้อมูล' }}</span>
            </button>
            <!-- Embed Zoom Control -->
            <div v-if="embedUrl" class="zoom-control" role="group" aria-label="ปรับขนาดแดชบอร์ด">
              <button
                type="button"
                class="zoom-button"
                title="ย่อขนาดแดชบอร์ด (เห็นเนื้อหามากขึ้น)"
                aria-label="ย่อขนาดแดชบอร์ด"
                :disabled="embedZoom <= ZOOM_MIN"
                @click="zoomOut"
              >
                −
              </button>
              <button
                type="button"
                class="zoom-level"
                title="กลับไปขนาด 100%"
                aria-label="รีเซ็ตขนาดแดชบอร์ดเป็น 100%"
                @click="resetZoom"
              >
                {{ Math.round(embedZoom * 100) }}%
              </button>
              <button
                type="button"
                class="zoom-button"
                title="ขยายขนาดแดชบอร์ด"
                aria-label="ขยายขนาดแดชบอร์ด"
                :disabled="embedZoom >= ZOOM_MAX"
                @click="zoomIn"
              >
                +
              </button>
            </div>
            <button
              type="button"
              class="action-button fullscreen-button"
              :title="immersive ? 'ออกจากโหมดเต็มจอ' : 'โหมดเต็มจอ'"
              :aria-label="immersive ? 'ออกจากโหมดเต็มจอ' : 'โหมดเต็มจอ'"
              @click="toggleFullscreen"
            >
              <svg v-if="!immersive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span class="action-label">{{ immersive ? 'ย่อ' : 'เต็มจอ' }}</span>
            </button>
          </template>
        </DashboardViewHeader>

        <!-- Main Content with TwoPane -->
        <TwoPaneLayout :sidebar-width="320" :show-sidebar="showInfoSidebar">
          <!-- Left Pane: Dashboard Info -->
          <template #sidebar>
            <div class="dashboard-sidebar">
              <!-- Dashboard Metadata -->
              <section class="sidebar-section">
                <h3 class="section-title">Dashboard Info</h3>
                <div v-if="dashboard.isArchived" class="info-group">
                  <label>สถานะ</label>
                  <p class="info-value">
                    <span class="badge badge-archived">📦 เก็บถาวร</span>
                  </p>
                </div>
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
            <!-- Embed URL Loading -->
            <div v-if="embedUrlLoading" class="iframe-loading">
              <div class="loading-spinner" />
              <p>Loading embed URL...</p>
            </div>

            <!-- Looker Embed -->
            <div v-else-if="embedUrl" class="looker-embed">
              <!-- Loading overlay -->
              <div v-if="iframeLoading" class="iframe-loading">
                <div class="loading-spinner" />
                <p>Loading dashboard...</p>
              </div>
              <iframe
                :src="embedUrl"
                class="embed-iframe"
                :style="embedZoomStyle"
                title="Looker Dashboard"
                frameborder="0"
                referrerpolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                @load="iframeLoading = false"
                @error="iframeError = true"
              />
              <!-- Watermark Overlay -->
              <div v-if="watermarkEmail" class="watermark-overlay" :style="watermarkStyle">
                <span v-for="n in 36" :key="n" class="watermark-text">{{ watermarkEmail }}</span>
              </div>
            </div>

            <!-- No Embed URL Configured -->
            <div v-else class="dashboard-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <h2>Looker Dashboard</h2>
              <p>Looker dashboard embed URL not configured</p>
              <div class="placeholder-info">
                <strong>Dashboard ID:</strong> {{ dashboard.id }}
              </div>
            </div>
          </div>
        </TwoPaneLayout>
      </div>
    </div>

    <!-- Edit Info Dialog -->
    <DashboardEditDialog
      v-if="dashboard"
      v-model="showEditDialog"
      :dashboard="dashboard"
      @saved="handleEditSave"
    />

    <!-- Archive Confirm Dialog -->
    <ConfirmDialog
      :is-open="showArchiveConfirm"
      title="เก็บถาวรแดชบอร์ด"
      :message="`คุณแน่ใจว่าต้องการเก็บถาวร '${dashboard?.name}' หรือไม่? แดชบอร์ดจะถูกซ่อนจากหน้า Discover`"
      confirm-text="เก็บถาวร"
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="showArchiveConfirm = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import type { Dashboard, Folder, User } from '~/types/dashboard'
import AppLayout from '~/components/layouts/AppLayout.vue'
import TwoPaneLayout from '~/components/compositions/TwoPaneLayout.vue'
import DashboardViewHeader from '~/components/features/DashboardViewHeader.vue'
import DashboardEditDialog from '~/components/dashboard/DashboardEditDialog.vue'
import ConfirmDialog from '~/components/admin/ConfirmDialog.vue'
import { useAppToast } from '~/composables/useToast'
import { useAdminTags } from '~/composables/useAdminTags'
import { useDashboardStore } from '~/stores/dashboard'
import { useRecentDashboards } from '~/composables/useRecentDashboards'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

// Router and Auth
const router = useRouter()
const route = useRoute()
const { user, getIdToken } = useAuth()
const dashboardService = useDashboardService()
const { showToast } = useAppToast()
const { fetchTags } = useAdminTags()
const dashboardStore = useDashboardStore()
const { recordVisit } = useRecentDashboards()

// State
const dashboard = ref<Dashboard | null>(null)
const currentFolder = ref<Folder | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const accessDenied = ref(false)
const menuOpen = ref(false)
const relatedDashboards = ref<Dashboard[]>([])
const owner = ref<User | null>(null)
const embedUrl = ref<string | null>(null)
const embedUrlLoading = ref(false)
const iframeLoading = ref(true)
const iframeError = ref(false)
const showInfoSidebar = ref(false)
const showEditDialog = ref(false)
/**
 * In-app fullscreen: hide this page's own header so the report gets its height.
 *
 * This replaced an `isFullscreen` ref that mirrored the browser's native state.
 * That was the wrong thing to drive the UI from: on iPhone it can never become
 * true, so the button's label and icon never changed and nothing on screen
 * moved. `immersive` is something this page controls, so it means the same
 * thing everywhere.
 */
const immersive = ref(false)
const watermarkOffset = ref({ x: 0, y: 0 })
let watermarkTimer: ReturnType<typeof setInterval> | null = null

// Embed zoom — Chrome's own zoom is a no-op here because the Looker Studio
// report always rescales itself to fit the iframe width, so zooming the page
// grows the iframe and the report by the same factor. Shrinking the embed
// ourselves (taller iframe scaled down) is what actually reveals more rows.
const ZOOM_MIN = 0.4
const ZOOM_MAX = 1
const ZOOM_STEP = 0.1
const ZOOM_STORAGE_KEY = 'streamhub:embed-zoom'
const embedZoom = ref(1)

// Computed properties
const dashboardId = computed(() => route.params.id as string)
const currentUserId = computed(() => user.value?.uid || '')
const currentUserRole = computed(() => user.value?.role || 'user')

const watermarkEmail = computed(() => user.value?.email || '')

const watermarkStyle = computed(() => ({
  transform: `translate(${watermarkOffset.value.x}px, ${watermarkOffset.value.y}px)`,
}))

// Keep the iframe as wide as the pane but proportionally taller, then scale the
// whole thing back down: the report keeps fitting the (unchanged) iframe width,
// so the extra height translates into more visible rows. `left` re-centres the
// now-narrower result inside the pane.
const embedZoomStyle = computed(() => {
  const zoom = embedZoom.value
  if (zoom === 1) return {}
  return {
    height: `${100 / zoom}%`,
    transform: `scale(${zoom})`,
    left: `${(1 - zoom) * 50}%`,
  }
})

const ownerName = computed(() => {
  if (owner.value) {
    return `${owner.value.name} (${owner.value.email})`
  }
  return 'Unknown'
})

const isPublic = computed(() => {
  if (!dashboard.value) return false
  // Check if direct or company access is configured
  const hasDirectAccess =
    dashboard.value.access.direct.users.length > 0 ||
    dashboard.value.access.direct.groups.length > 0 ||
    dashboard.value.access.company.length > 0
  return hasDirectAccess
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
      error.value = 'คุณไม่มีสิทธิ์เข้าถึงรายงานนี้'
      // Log denied audit event (fire-and-forget)
      const authStore = useAuthStore()
      getIdToken().then(token => {
        const headers: Record<string, string> = {}
        if (token) headers.Authorization = `Bearer ${token}`
        const query: Record<string, string> = {}
        if (authStore.user?.uid) query.uid = authStore.user.uid
        $fetch('/api/audit/log', {
          method: 'POST',
          headers,
          query,
          body: { dashboardId: dashboardId.value, action: 'denied', dashboardName: data.name },
        }).catch(() => {})
      }).catch(() => {})
      return
    }

    dashboard.value = data

    // Record visit for Recent Dashboards on home page
    if (currentUserId.value) {
      recordVisit(currentUserId.value, data.id, data.name)
    }

    // Load folder info
    const folder = await dashboardService.getFolder(data.folderId)
    if (folder) {
      currentFolder.value = folder
    }

    // Load owner info — only admin/moderator can fetch user profiles across companies
    if (currentUserRole.value === 'admin' || currentUserRole.value === 'moderator') {
      const ownerData = await dashboardService.getUser(data.owner)
      if (ownerData) {
        owner.value = ownerData
      }
    }

    // Fetch embed URL separately (security: not included in dashboard response)
    embedUrlLoading.value = true
    try {
      embedUrl.value = await dashboardService.getDashboardEmbedUrl(dashboardId.value)
    } finally {
      embedUrlLoading.value = false
    }

    // Load related dashboards in same folder
    const related = await dashboardService.getDashboardsByFolder(data.folderId, currentUserId.value)
    relatedDashboards.value = related.filter((d) => d.id !== dashboardId.value).slice(0, 5)

    // Send audit log event (fire-and-forget, don't block page load)
    const authStore = useAuthStore()
    getIdToken().then(token => {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const query: Record<string, string> = {}
      if (authStore.user?.uid) query.uid = authStore.user.uid
      $fetch('/api/audit/log', {
        method: 'POST',
        headers,
        query,
        body: { dashboardId: dashboardId.value, action: 'view', dashboardName: data.name },
      }).catch(() => { /* audit log failure is non-blocking */ })
    }).catch(() => { /* token failure is non-blocking */ })
  } catch (err: unknown) {
    if (getErrorStatus(err) === 403) {
      // Access denied — show friendly message and log denied audit
      accessDenied.value = true
      const authStore = useAuthStore()
      getIdToken().then(token => {
        const headers: Record<string, string> = {}
        if (token) headers.Authorization = `Bearer ${token}`
        const query: Record<string, string> = {}
        if (authStore.user?.uid) query.uid = authStore.user.uid
        $fetch('/api/audit/log', {
          method: 'POST',
          headers,
          query,
          body: { dashboardId: dashboardId.value, action: 'denied' },
        }).catch(() => {})
      }).catch(() => {})
    } else {
      error.value = getErrorMessage(err, 'Failed to load dashboard')
      console.error('Error loading dashboard:', err)
    }
  } finally {
    isLoading.value = false
  }
}

// Event handlers
const handleGoBack = async () => {
  // Prefer browser back so the previous page (Explorer folder + scroll, Discover
  // filters, Home) is restored. Fall back to Discover when there is no in-app
  // history — direct link or hard refresh.
  //
  // Vue Router records the previous in-app entry in history.state.back, which is
  // null on a cold entry. window.history.length counts the whole tab instead, so
  // it can't tell a cold entry from a real in-app visit and would navigate the
  // user out of the app (back to google.com, etc.).
  if (window.history.state?.back) {
    router.back()
    return
  }
  await router.push('/dashboard/discover')
}

const handleViewRelated = async (relatedId: string) => {
  await router.push(`/dashboard/view/${relatedId}`)
}

const handleEditInfo = async () => {
  menuOpen.value = false
  // Ensure tags are loaded for the edit dialog
  await fetchTags()
  showEditDialog.value = true
}

const handleEditSave = async (updated: Dashboard) => {
  try {
    await dashboardService.updateDashboard(updated)
    dashboard.value = updated
    showEditDialog.value = false
    dashboardStore.clearCache()
    showToast('บันทึกข้อมูลแดชบอร์ดสำเร็จ', 'success')
  } catch (err) {
    console.error('Failed to update dashboard:', err)
    showToast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง', 'error')
  }
}

const isPrinting = ref(false)

const handleDownload = () => {
  menuOpen.value = false
  window.print()
}

const onBeforePrint = () => {
  isPrinting.value = true
}
const onAfterPrint = () => {
  isPrinting.value = false
}

const showArchiveConfirm = ref(false)
const isArchiving = ref(false)

const handleArchive = () => {
  menuOpen.value = false
  showArchiveConfirm.value = true
}

const confirmArchive = async () => {
  if (!dashboard.value || isArchiving.value) return
  isArchiving.value = true
  try {
    const updated = { ...dashboard.value, isArchived: true, archivedAt: new Date() }
    await dashboardService.updateDashboard(updated)
    dashboardStore.clearCache()
    showArchiveConfirm.value = false
    showToast('เก็บถาวรแดชบอร์ดสำเร็จ', 'success')
    await router.push('/dashboard/discover')
  } catch (err) {
    console.error('Failed to archive dashboard:', err)
    showToast('ไม่สามารถเก็บถาวรได้ กรุณาลองอีกครั้ง', 'error')
  } finally {
    isArchiving.value = false
  }
}

const handleUnarchive = async () => {
  if (!dashboard.value) return
  menuOpen.value = false
  isArchiving.value = true
  try {
    const updated = { ...dashboard.value, isArchived: false, archivedAt: undefined }
    await dashboardService.updateDashboard(updated)
    dashboard.value = { ...dashboard.value, isArchived: false, archivedAt: undefined }
    dashboardStore.clearCache()
    showToast('ยกเลิกเก็บถาวรแดชบอร์ดสำเร็จ', 'success')
  } catch (err) {
    console.error('Failed to unarchive dashboard:', err)
    showToast('ไม่สามารถยกเลิกเก็บถาวรได้ กรุณาลองอีกครั้ง', 'error')
  } finally {
    isArchiving.value = false
  }
}

// Vendor-prefixed Fullscreen API (Safari still ships the webkit- names only)
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

const getFullscreenElement = () => {
  const doc = document as FullscreenDocument
  return doc.fullscreenElement || doc.webkitFullscreenElement || null
}

/**
 * iPhone Safari implements the Fullscreen API for `<video>` only — no element,
 * including the document root, can be made fullscreen. Both entry points are
 * simply absent there.
 *
 * That mattered because of how the call was written: `webkitRequestFullscreen?.()`
 * returns `undefined` when the method does not exist, `await undefined` resolves,
 * and nothing throws — so the `catch` that exists to report failure never ran and
 * the button did nothing at all, silently. Ask before calling.
 */
const supportsNativeFullscreen = () => {
  if (typeof document === 'undefined') return false
  const el = document.documentElement as FullscreenElement
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'
}

// Fullscreen the document root, not just the dashboard pane: dialogs and toasts
// render outside this page's subtree and would be invisible otherwise.
const toggleFullscreen = async () => {
  const doc = document as FullscreenDocument
  const target = document.documentElement as FullscreenElement

  // The in-app part always applies; native fullscreen is an extra on top where
  // the browser offers it. Doing it this way means iPhone still gets the header
  // back, instead of a message explaining why it gets nothing.
  const entering = !immersive.value
  immersive.value = entering

  if (!supportsNativeFullscreen()) return

  try {
    if (entering) {
      await (target.requestFullscreen ? target.requestFullscreen() : target.webkitRequestFullscreen?.())
    } else if (getFullscreenElement()) {
      await (doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.())
    }
  } catch (err) {
    // Immersive mode is already on, so this is a partial success: the report
    // has its space, the browser just kept its chrome. Say that rather than
    // implying nothing happened.
    console.error('Failed to toggle native fullscreen:', err)
    showToast('ซ่อนแถบเบราว์เซอร์ไม่ได้ แต่ขยายพื้นที่แดชบอร์ดให้แล้ว', 'error')
  }
}

/** Esc leaves immersive mode where there is no native fullscreen to leave. */
const onImmersiveKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && immersive.value && !getFullscreenElement()) {
    immersive.value = false
  }
}

// Leaving native fullscreen by Esc or the browser's own control should leave
// immersive mode too — otherwise the header stays hidden with no way back that
// the user associates with what they just pressed.
const handleFullscreenChange = () => {
  if (!getFullscreenElement()) immersive.value = false
}

const applyZoom = (value: number) => {
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))
  embedZoom.value = clamped
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped))
  } catch {
    // Private mode / storage disabled — zoom still works for this session
  }
}

const zoomIn = () => applyZoom(embedZoom.value + ZOOM_STEP)
const zoomOut = () => applyZoom(embedZoom.value - ZOOM_STEP)
const resetZoom = () => applyZoom(1)

const restoreZoom = () => {
  try {
    const saved = Number(localStorage.getItem(ZOOM_STORAGE_KEY))
    if (Number.isFinite(saved) && saved >= ZOOM_MIN && saved <= ZOOM_MAX) {
      embedZoom.value = saved
    }
  } catch {
    // Ignore — fall back to 100%
  }
}

// Lifecycle
onMounted(async () => {
  restoreZoom()
  document.addEventListener('keydown', onImmersiveKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  window.addEventListener('beforeprint', onBeforePrint)
  window.addEventListener('afterprint', onAfterPrint)
  // Shift watermark position every 30 seconds to deter screenshot stitching
  watermarkTimer = setInterval(() => {
    watermarkOffset.value = {
      x: Math.floor(Math.random() * 40) - 20,
      y: Math.floor(Math.random() * 40) - 20,
    }
  }, 30_000)
  await loadDashboard()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onImmersiveKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  window.removeEventListener('beforeprint', onBeforePrint)
  window.removeEventListener('afterprint', onAfterPrint)
  if (watermarkTimer) {
    clearInterval(watermarkTimer)
    watermarkTimer = null
  }
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

.badge-archived {
  background: #fef3c7;
  color: #92400e;
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
  position: relative;
}

.iframe-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: white;
  z-index: 1;
}

.iframe-loading p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.embed-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  /* Zoom scales down from the top-left; `left` (set inline) re-centres it */
  transform-origin: top left;
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
/* A `@media (max-width: 768px)` block sat here duplicating
   DashboardViewHeader.vue's copy byte for byte — including
   `flex-direction: column`. Both landed on the same element (a child
   component's root inherits the parent's scope id) at identical specificity,
   so which one won came down to chunk order, and this one would have silently
   undone the single-row header the height query below sets up. Removed.

   Base copies of `.view-header`, `.header-right` and `.dashboard-title` are
   still duplicated in this file. They set the same values the component does,
   so nothing renders differently today, but they are the same hazard and
   should be consolidated into the component in their own change — not folded
   into a layout fix, where a mistake would be hard to spot.

   The rules below are genuinely this file's: buttons passed into the #actions
   slot are compiled here, so only this scope id reaches them. */

/* Below ~640px the four controls in .header-right add up to more width than
   the row has (roughly 395px of content in 343px at a 375px viewport). The
   row does not wrap, so everything is squeezed: the two text labels break
   onto a second line and .zoom-control — which clips with `overflow: hidden`
   — loses its `+` button entirely. Clipped, it is neither visible nor
   clickable, so zooming in becomes impossible on a phone. That matters more
   than it looks: this control exists because the browser's own zoom does
   nothing to a Looker report, which refits itself to the iframe width
   (PR #351).

   Dropping the two labels frees ~150px and everything fits on one row, which
   keeps the header one line tall and leaves the report the height it had.
   Both buttons carry an aria-label so hiding the text costs no accessible
   name — the zoom buttons already had theirs. [BUG-030, TC 7.2] */
/* The info sidebar is `display: none` below 768px (TwoPaneLayout.vue), so the
   button that toggles it flips state and produces nothing visible — it looked
   broken because it was. Hiding it matches the breakpoint that hides what it
   controls, and takes its ~34px with it. `display: none` also drops it from
   the tab order and the accessibility tree, which a disabled-looking button
   would not have.

   Admins wanting the metadata on a phone need a wider window; the alternative
   was making the sidebar stack below the report, which trades away the
   vertical space this whole run of changes has been reclaiming. */
@media (max-width: 768px) {
  .toggle-sidebar-button {
    display: none;
  }
}

@media (max-width: 640px) {
  .action-label {
    display: none;
  }

  /* Without a label there is nothing to sit beside the icon, so the 0.5rem
     gap would pad the button off-centre. */
  .action-button {
    gap: 0;
    padding: 0.5rem;
  }
}

/* Same treatment when the viewport is short rather than narrow — a phone held
   sideways is 667px wide, so the width query above does not fire, yet its
   375px of height is the scarcer resource. Dropping the labels here is what
   lets the header collapse back to one row; DashboardViewHeader.vue handles
   the rest of that block and explains the reasoning. Change them together. */
@media (max-height: 500px) {
  .action-label {
    display: none;
  }

  .action-button {
    gap: 0;
    padding: 0.375rem;
  }
}

/* ========== Fullscreen Mode ========== */
.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: white;
}

.toggle-sidebar-button svg,
.fullscreen-button svg {
  width: 1rem;
  height: 1rem;
}

/* Native fullscreen targets the document root, which defaults to a black
   backdrop — keep the same white surface the overlay already uses. */
:global(html:fullscreen) {
  background: white;
}

/* ========== Immersive Mode ========== */

/* The header is this page's own ~48px. Native fullscreen only ever hid the
   browser's chrome, and on iPhone not even that — so hiding the header is what
   actually gives the report room, on every device. */
.is-immersive .view-header {
  display: none;
}

.immersive-exit {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 60;
  padding: 0.5rem;
  gap: 0;
  /* Sits over the report, so it needs to stay legible against whatever colour
     happens to be underneath without blocking much of it. */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
}

.immersive-exit:hover {
  background: rgba(255, 255, 255, 0.95);
}

.immersive-exit svg {
  width: 1rem;
  height: 1rem;
}

/* ========== Embed Zoom Control ========== */
.zoom-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: white;
  overflow: hidden;
}

.zoom-button,
.zoom-level {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  padding: 0.5rem 0.75rem;
  transition: background 0.2s;
}

.zoom-button {
  font-size: 1.125rem;
  line-height: 1;
}

.zoom-level {
  min-width: 3.5rem;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  font-variant-numeric: tabular-nums;
}

.zoom-button:hover:not(:disabled),
.zoom-level:hover {
  background: var(--color-bg-light);
}

.zoom-button:disabled {
  color: var(--color-border);
  cursor: not-allowed;
}

/* ========== Watermark Overlay ========== */
.watermark-overlay {
  position: absolute;
  inset: -50%;
  z-index: 2;
  pointer-events: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4rem 3rem;
  rotate: -30deg;
  opacity: 0.09;
  overflow: hidden;
  transition: transform 2s ease-in-out;
}

.watermark-text {
  white-space: nowrap;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  user-select: none;
  letter-spacing: 0.05em;
}

/* ========== Print: programmatic hiding via beforeprint/afterprint ========== */
.is-printing :deep(.view-header) {
  display: none !important;
}
.is-printing :deep(.two-pane-sidebar) {
  display: none !important;
}
.is-printing .watermark-overlay {
  display: none !important;
}
.is-printing.is-fullscreen {
  position: static;
  z-index: auto;
}
</style>

<!-- Global (unscoped) print styles — no data-v attribute constraint -->
<style>
@media print {
  /* Hide app-level chrome */
  .app-sidebar,
  .app-header,
  .app-nav,
  .sidebar-overlay {
    display: none !important;
  }

  /* Hide dashboard view header (incl. dropdown menu) */
  .dashboard-view-content .view-header {
    display: none !important;
  }

  /* Hide sidebar pane */
  .dashboard-view-content .two-pane-sidebar {
    display: none !important;
  }

  /* Hide watermark */
  .dashboard-view-content .watermark-overlay {
    display: none !important;
  }

  /* Reset fullscreen overlay */
  .dashboard-view-content.is-fullscreen {
    position: static !important;
    z-index: auto !important;
  }

  /* Expand content to fill page */
  .view-page,
  .dashboard-view-content,
  .dashboard-main,
  .looker-embed {
    height: 100% !important;
    width: 100% !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
  }

  .dashboard-view-content .two-pane-layout,
  .dashboard-view-content .two-pane-main {
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
  }

  /* Drop the zoom transform so the print layout keeps its own sizing */
  .embed-iframe {
    position: static !important;
    width: 100% !important;
    height: 100vh !important;
    border: none !important;
    transform: none !important;
    left: auto !important;
  }
}
</style>
