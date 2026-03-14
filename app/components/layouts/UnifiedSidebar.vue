<script setup lang="ts">
/**
 * UnifiedSidebar Component
 * Role-based sidebar navigation for StreamHub (Phase 5 Redesign)
 *
 * Features:
 * - Role-based menu groups via useRoleNavigation
 * - Dashboard group (all roles): View All + Search
 * - Manage Folders group (moderator only)
 * - Admin group (admin only)
 * - Mutually exclusive accordions (one group open at a time)
 * - No folder tree in sidebar (folders are filters on discover page)
 *
 * Props kept for backward compatibility with PageLayout:
 * - folders, showFolders, selectedFolderId, allowSearch, allowCreate
 *   are accepted but no longer rendered in sidebar.
 *
 * Usage:
 * <UnifiedSidebar />
 */

import { computed, watch, onMounted } from 'vue'
import type { Folder } from '~/types/dashboard'
import AdminAccordion from '~/components/admin/AdminAccordion.vue'
import { useDashboardStore } from '~/stores/dashboard'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useRoleNavigation } from '~/composables/useRoleNavigation'

interface Props {
  /** @deprecated Folders are no longer shown in sidebar. Kept for backward compat. */
  folders?: Folder[]
  /** @deprecated Folder section removed from sidebar. Kept for backward compat. */
  showFolders?: boolean
  /** Show admin accordion section (overridden by role if not set) */
  showAdmin?: boolean
  /** @deprecated Not used. Kept for backward compat. */
  selectedFolderId?: string | null
  /** @deprecated Not used. Kept for backward compat. */
  allowSearch?: boolean
  /** @deprecated Not used. Kept for backward compat. */
  allowCreate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  folders: () => [],
  showFolders: false,
  showAdmin: undefined,
  selectedFolderId: null,
  allowSearch: true,
  allowCreate: false,
})

defineEmits<{
  'select-folder': [folder: Folder]
  'create-folder': []
}>()

// Role navigation — source of truth for menu groups
const { menuGroups, showAdmin: roleShowAdmin } = useRoleNavigation()

// Store and composables
const dashboardStore = useDashboardStore()
const route = useRoute()
const { user } = useAuth()

// Effective showAdmin: prop override or role-based
const effectiveShowAdmin = computed(() =>
  props.showAdmin !== undefined ? props.showAdmin : roleShowAdmin.value
)

/**
 * Accordion states — persisted in store across navigation
 */
const isDashboardOpen = computed({
  get: () => dashboardStore.isFoldersAccordionOpen,
  set: (value) => dashboardStore.setFoldersAccordionOpen(value),
})

const isAdminOpen = computed({
  get: () => dashboardStore.isAdminAccordionOpen,
  set: (value) => dashboardStore.setAdminAccordionOpen(value),
})

/**
 * Initialize accordion states on mount based on current page
 * - /admin pages: Admin open, Dashboard closed
 * - /dashboard pages: Dashboard open, Admin closed
 */
onMounted(() => {
  const isAdminPage = route.path.startsWith('/admin')
  const isAdminUser = user.value?.role === 'admin'
  dashboardStore.initializeAccordionStates(isAdminPage, isAdminUser)
})

/**
 * Mutually exclusive accordion behavior
 * When one accordion opens, close the other
 */
watch(() => isAdminOpen.value, (newVal) => {
  if (newVal) {
    isDashboardOpen.value = false
  }
})

watch(() => isDashboardOpen.value, (newVal) => {
  if (newVal && effectiveShowAdmin.value) {
    isAdminOpen.value = false
  }
})

/**
 * Dashboard menu items for AdminAccordion
 */
const dashboardMenuItems = computed(() => {
  const dashboardGroup = menuGroups.value.find(g => g.id === 'dashboard')
  return dashboardGroup?.items ?? []
})

/**
 * Admin menu items for AdminAccordion
 */
const adminMenuItems = computed(() => {
  const adminGroup = menuGroups.value.find(g => g.id === 'admin')
  return adminGroup?.items ?? []
})
</script>

<template>
  <div class="unified-sidebar">
    <!-- Dashboard Accordion (All roles) -->
    <AdminAccordion
      v-model="isDashboardOpen"
      title="แดชบอร์ด"
      :items="dashboardMenuItems"
    />

    <!-- Admin Accordion (Admin only) -->
    <AdminAccordion
      v-if="effectiveShowAdmin"
      v-model="isAdminOpen"
      title="ผู้ดูแลระบบ"
      :items="adminMenuItems"
    />

    <!-- Footer Slot (Optional) -->
    <slot name="footer" />
  </div>
</template>

<style scoped>
/* ========== UNIFIED SIDEBAR WRAPPER ========== */
.unified-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-primary, #ffffff);
  overflow: hidden;
}

/* ========== CUSTOM SCROLLBAR ========== */
.unified-sidebar {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.unified-sidebar::-webkit-scrollbar {
  width: 6px;
}

.unified-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.unified-sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.unified-sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
