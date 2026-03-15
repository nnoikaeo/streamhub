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

import { computed, ref, watch, onMounted } from 'vue'
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
const { menuGroups, showAdmin: roleShowAdmin, showManageFolders } = useRoleNavigation()

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

const isManageFoldersOpen = computed({
  get: () => dashboardStore.isManageFoldersAccordionOpen,
  set: (value) => dashboardStore.setManageFoldersAccordionOpen(value),
})

// Local expand state for folder tree items
const expandedFolderPaths = ref(new Set<string>())

/**
 * Initialize accordion states on mount based on current page
 * - /admin pages: Admin open, Dashboard closed
 * - /dashboard pages: Dashboard open, Admin closed
 */
onMounted(() => {
  const isAdminPage = route.path.startsWith('/admin')
  const isManagePage = route.path.startsWith('/manage')
  const isAdminUser = user.value?.role === 'admin'
  dashboardStore.initializeAccordionStates(isAdminPage, isAdminUser, isManagePage)
})

/**
 * Mutually exclusive accordion behavior
 * When one accordion opens, close the other
 */
watch(() => isAdminOpen.value, (newVal) => {
  if (newVal) {
    isDashboardOpen.value = false
    isManageFoldersOpen.value = false
  }
})

watch(() => isDashboardOpen.value, (newVal) => {
  if (newVal) {
    isAdminOpen.value = false
    isManageFoldersOpen.value = false
  }
})

watch(() => isManageFoldersOpen.value, (newVal) => {
  if (newVal) {
    isDashboardOpen.value = false
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

/**
 * Manage Folders items (folder tree)
 */
const manageFolderItems = computed(() => {
  const group = menuGroups.value.find(g => g.id === 'manage-folders')
  return group?.items ?? []
})

/**
 * Toggle expand/collapse of a folder tree item
 */
const toggleFolderExpand = (path: string) => {
  if (expandedFolderPaths.value.has(path)) {
    expandedFolderPaths.value.delete(path)
  } else {
    expandedFolderPaths.value.add(path)
  }
  // Trigger reactivity on Set mutation
  expandedFolderPaths.value = new Set(expandedFolderPaths.value)
}

/**
 * Check if a folder path matches the active route
 */
const isActiveFolderPath = (path: string): boolean => route.path.startsWith(path)
</script>

<template>
  <div class="unified-sidebar">
    <!-- Dashboard Accordion (All roles) -->
    <AdminAccordion
      v-model="isDashboardOpen"
      title="แดชบอร์ด"
      :items="dashboardMenuItems"
    />

    <!-- Manage Folders Accordion (Moderator only) -->
    <AdminAccordion
      v-if="showManageFolders"
      v-model="isManageFoldersOpen"
      title="จัดการโฟลเดอร์"
      :items="[]"
    >
      <template #items>
        <div
          v-for="folder in manageFolderItems"
          :key="folder.path"
          class="folder-tree-root"
        >
          <div
            class="folder-item"
            :class="{ 'folder-item--active': isActiveFolderPath(folder.path) }"
          >
            <button
              v-if="folder.children?.length"
              class="folder-expand-btn"
              @click.stop="toggleFolderExpand(folder.path)"
            >{{ expandedFolderPaths.has(folder.path) ? '▾' : '▸' }}</button>
            <span v-else class="folder-expand-spacer" />
            <NuxtLink :to="folder.path" class="folder-link">
              <span class="folder-item__icon">{{ folder.icon }}</span>
              <span class="folder-item__label">{{ folder.label }}</span>
              <span v-if="folder.badge" class="folder-item__badge">{{ folder.badge }}</span>
            </NuxtLink>
          </div>
          <div v-if="folder.children?.length && expandedFolderPaths.has(folder.path)" class="folder-children">
            <NuxtLink
              v-for="child in folder.children"
              :key="child.path"
              :to="child.path"
              class="folder-item folder-item--child"
              :class="{ 'folder-item--active': isActiveFolderPath(child.path) }"
            >
              <span class="folder-item__icon">{{ child.icon }}</span>
              <span class="folder-item__label">{{ child.label }}</span>
              <span v-if="child.badge" class="folder-item__badge">{{ child.badge }}</span>
            </NuxtLink>
          </div>
        </div>
      </template>
    </AdminAccordion>

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

/* ========== FOLDER TREE ========== */
.folder-tree-root {
  display: flex;
  flex-direction: column;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.25rem);
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9375rem;
  transition: background-color var(--transition-base, 0.2s ease);
}

.folder-item:hover {
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-primary, #3b82f6);
}

.folder-item--active {
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-primary, #3b82f6);
  font-weight: 600;
  border-left: 3px solid var(--color-primary, #3b82f6);
}

.folder-expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0.25rem 0 0;
  color: inherit;
  font-size: 0.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.folder-expand-spacer {
  display: inline-block;
  width: 1rem;
  flex-shrink: 0;
}

.folder-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.folder-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1rem;
  flex-shrink: 0;
}

.folder-item__label {
  flex: 1;
}

.folder-item__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  background-color: var(--color-primary, #3b82f6);
  color: #fff;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.folder-children {
  display: flex;
  flex-direction: column;
}

.folder-item--child {
  padding-left: calc(var(--spacing-lg, 1.25rem) + 1.5rem);
  text-decoration: none;
}
</style>
