<script setup lang="ts">
/**
 * ExplorerContentsPanel Component
 *
 * Right panel of the Admin Explorer page.
 * Displays subfolders and dashboards of the currently selected folder.
 *
 * Features:
 * - Toolbar: New Folder / New Dashboard buttons
 * - Folders listed first, then dashboards (Windows Explorer convention)
 * - Hover-reveal action buttons (edit, delete) per row
 * - Double-click: navigate into folder / open dashboard
 * - Empty state with quick-create actions
 */

import type { Folder, Dashboard } from '~/types/dashboard'

interface Props {
  subfolders: Folder[]
  dashboards: Dashboard[]
  isAdmin: boolean
  loading: boolean
  currentFolderId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'new-folder': []
  'new-dashboard': []
  'edit-folder': [folder: Folder]
  'edit-dashboard': [dashboard: Dashboard]
  'delete-folder': [folder: Folder]
  'delete-dashboard': [dashboard: Dashboard]
  'navigate-folder': [folder: Folder]
  'open-dashboard': [dashboard: Dashboard]
}>()

const isEmpty = computed(() => props.subfolders.length === 0 && props.dashboards.length === 0)
const canCreateDashboard = computed(() => !!props.currentFolderId)
</script>

<template>
  <div class="contents-panel">
    <!-- Toolbar -->
    <div class="contents-toolbar">
      <div class="toolbar-actions">
        <button
          v-if="isAdmin"
          class="theme-btn theme-btn--primary"
          @click="emit('new-folder')"
        >
          + โฟลเดอร์ใหม่
        </button>
        <button
          class="theme-btn theme-btn--secondary"
          :disabled="!canCreateDashboard"
          :title="!canCreateDashboard ? 'เลือก folder ก่อนสร้าง dashboard' : 'สร้าง dashboard ใน folder นี้'"
          @click="emit('new-dashboard')"
        >
          + แดชบอร์ดใหม่
        </button>
      </div>
      <span class="contents-count">
        {{ subfolders.length }} folder{{ subfolders.length !== 1 ? 's' : '' }},
        {{ dashboards.length }} dashboard{{ dashboards.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="contents-state">
      <span class="state-text">กำลังโหลด...</span>
    </div>

    <!-- Empty State (no items at all) -->
    <div v-else-if="isEmpty" class="contents-state">
      <p class="state-text">ยังไม่มีเนื้อหาใน folder นี้</p>
      <div class="state-actions">
        <button
          v-if="isAdmin"
          class="theme-btn theme-btn--ghost"
          @click="emit('new-folder')"
        >
          สร้าง Folder
        </button>
        <button
          v-if="canCreateDashboard"
          class="theme-btn theme-btn--ghost"
          @click="emit('new-dashboard')"
        >
          สร้าง Dashboard
        </button>
      </div>
    </div>

    <!-- Contents Table -->
    <div v-else class="contents-table">
      <!-- Header -->
      <div class="table-header">
        <span class="col-name">ชื่อ</span>
        <span class="col-type">ประเภท</span>
        <span class="col-status">สถานะ</span>
        <span class="col-actions" />
      </div>

      <!-- Folder Rows -->
      <div
        v-for="folder in subfolders"
        :key="folder.id"
        class="table-row table-row--folder"
        @dblclick="emit('navigate-folder', folder)"
      >
        <span class="col-name">
          <span class="item-icon item-icon--folder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
          </span>
          <span class="item-name">{{ folder.name }}</span>
        </span>
        <span class="col-type">
          <span class="badge badge--folder">Folder</span>
        </span>
        <span class="col-status">
          <span :class="['badge', folder.isActive ? 'badge--active' : 'badge--inactive']">
            {{ folder.isActive ? 'Active' : 'Inactive' }}
          </span>
        </span>
        <span class="col-actions row-actions">
          <button
            class="action-btn"
            title="แก้ไข"
            @click.stop="emit('edit-folder', folder)"
          >✏️</button>
          <button
            class="action-btn action-btn--danger"
            title="ลบ"
            @click.stop="emit('delete-folder', folder)"
          >🗑️</button>
        </span>
      </div>

      <!-- Divider -->
      <div v-if="subfolders.length > 0 && dashboards.length > 0" class="table-divider" />

      <!-- Dashboard Rows -->
      <div
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        class="table-row table-row--dashboard"
        @dblclick="emit('open-dashboard', dashboard)"
      >
        <span class="col-name">
          <span class="item-icon item-icon--dashboard">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </span>
          <span class="item-name">{{ dashboard.name }}</span>
        </span>
        <span class="col-type">
          <span class="badge badge--dashboard">Dashboard</span>
        </span>
        <span class="col-status">
          <span :class="['badge', dashboard.isArchived ? 'badge--archived' : 'badge--active']">
            {{ dashboard.isArchived ? 'Archived' : 'Active' }}
          </span>
        </span>
        <span class="col-actions row-actions">
          <button
            class="action-btn"
            title="แก้ไข"
            @click.stop="emit('edit-dashboard', dashboard)"
          >✏️</button>
          <button
            class="action-btn action-btn--danger"
            title="ลบ"
            @click.stop="emit('delete-dashboard', dashboard)"
          >🗑️</button>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contents-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary, #fff);
  border-radius: var(--radius-lg, 0.5rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  overflow: hidden;
}

/* ── Toolbar ── */
.contents-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  background: var(--color-bg-secondary, #f9fafb);
  flex-shrink: 0;
  gap: var(--spacing-md, 1rem);
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
}


.contents-count {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  white-space: nowrap;
}

/* ── Empty / Loading State ── */
.contents-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md, 1rem);
  flex: 1;
  padding: var(--spacing-xl, 2rem);
}

.state-text {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
  margin: 0;
}

.state-actions {
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
}

/* ── Table ── */
.contents-table {
  flex: 1;
  overflow-y: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1fr 130px 110px 72px;
  align-items: center;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
}

.table-header {
  background: var(--color-bg-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #6b7280);
  position: sticky;
  top: 0;
  z-index: 1;
}

.table-row {
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  cursor: pointer;
  transition: background 0.12s ease;
}

.table-row:hover {
  background: var(--color-bg-secondary, #f9fafb);
}

.table-row:last-child {
  border-bottom: none;
}

.col-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  min-width: 0;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.item-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.item-icon--folder {
  color: #f59e0b;
}

.item-icon--dashboard {
  color: #3b82f6;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: var(--color-text-primary, #1f2937);
}

/* ── Badges ── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--folder    { background: #eff6ff; color: #1d4ed8; }
.badge--dashboard { background: #f0fdf4; color: #15803d; }
.badge--active    { background: #f0fdf4; color: #15803d; }
.badge--inactive  { background: #f3f4f6; color: #6b7280; }
.badge--archived  { background: #fef3c7; color: #92400e; }

/* ── Row hover-reveal actions ── */
.row-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.table-row:hover .row-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.12s ease;
}

.action-btn:hover {
  background: var(--color-bg-secondary, #e5e7eb);
}

.action-btn--danger:hover {
  background: #fee2e2;
}

/* ── Divider between folders and dashboards ── */
.table-divider {
  height: 2px;
  background: var(--color-border-light, #e5e7eb);
}
</style>
