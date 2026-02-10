<template>
  <div class="theme-card theme-card--primary">
    <div class="folder-header">
      <div>
        <h2 class="page-header__title">{{ folder.name }}</h2>
        <p v-if="folder.description" class="page-header__subtitle">
          {{ folder.description }}
        </p>
      </div>
      <div class="folder-stats">
        <span class="stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {{ dashboardCount }} dashboards
        </span>
        <span class="stat-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2h-2V5h2a2 2 0 0 1 2 2z" />
            <path d="M2 19a2 2 0 0 0 2 2h2V5H4a2 2 0 0 0-2 2z" />
            <line x1="6" y1="4" x2="18" y2="4" />
            <line x1="6" y1="20" x2="18" y2="20" />
          </svg>
          {{ folder.level || 0 }} level
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/types/dashboard'

defineProps<{
  folder: Folder
  dashboardCount: number
}>()
</script>

<style scoped>
.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.folder-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-item svg {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .folder-header {
    flex-direction: column;
  }

  .folder-stats {
    width: 100%;
    flex-direction: column;
  }
}
</style>
