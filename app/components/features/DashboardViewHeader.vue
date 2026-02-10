<template>
  <div class="view-header">
    <div class="header-left">
      <button
        type="button"
        class="back-nav-button"
        @click="emit('go-back')"
        aria-label="Go back to dashboards"
        title="Go back"
      >
        ←
      </button>
      <div>
        <h1 class="dashboard-title">{{ dashboard.name }}</h1>
        <div class="breadcrumb-nav">
          <span>Dashboard</span>
          <span class="breadcrumb-sep">/</span>
          <span>{{ folderName }}</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <button
        type="button"
        class="action-button share-button"
        @click="emit('share')"
        title="Quick share this dashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>
      <button
        type="button"
        class="action-button menu-button"
        :class="{ 'menu-open': menuOpen }"
        @click="emit('toggle-menu')"
        aria-label="More options"
        title="More options"
      >
        ⋮
      </button>

      <!-- Dropdown Menu -->
      <div v-if="menuOpen" class="dropdown-menu" role="menu">
        <button type="button" role="menuitem" class="menu-item" @click="emit('edit')">
          Edit Info
        </button>
        <button type="button" role="menuitem" class="menu-item" @click="emit('download')">
          Download
        </button>
        <button
          v-if="showManagePermissions"
          type="button"
          role="menuitem"
          class="menu-item"
          @click="emit('manage-permissions')"
        >
          Manage Permissions
        </button>
        <hr class="menu-divider" />
        <button type="button" role="menuitem" class="menu-item danger" @click="emit('archive')">
          Archive
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dashboard } from '~/types/dashboard'

defineProps<{
  dashboard: Dashboard
  folderName: string
  menuOpen: boolean
  showManagePermissions: boolean
}>()

const emit = defineEmits<{
  'go-back': []
  'share': []
  'toggle-menu': []
  'edit': []
  'download': []
  'manage-permissions': []
  'archive': []
}>()
</script>

<style scoped>
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
