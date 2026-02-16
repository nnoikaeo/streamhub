<template>
  <div class="recent-dashboards">
    <h2 class="recent-dashboards__title">Recent Dashboards</h2>
    
    <div v-if="dashboards.length > 0" class="recent-dashboards__list">
      <div
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        class="dashboard-item"
      >
        <div class="dashboard-item__icon">📊</div>
        <div class="dashboard-item__content">
          <h3 class="dashboard-item__name">{{ dashboard.name }}</h3>
          <p class="dashboard-item__time">Last accessed: {{ formatTime(dashboard.lastAccessed) }}</p>
        </div>
        <NuxtLink
          :to="`/dashboard/view?id=${dashboard.id}`"
          class="dashboard-item__link"
        >
          Open →
        </NuxtLink>
      </div>
    </div>

    <div v-else class="recent-dashboards__empty">
      <p>No recent dashboards</p>
    </div>

    <NuxtLink to="/dashboard/discover" class="recent-dashboards__view-all">
      View All Dashboards →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dashboards?: Array<{
    id: string
    name: string
    lastAccessed: Date | string
  }>
}>()

const dashboards = computed(() => props.dashboards || [])

const formatTime = (date: Date | string | undefined) => {
  if (!date) return 'Unknown'
  
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Unknown'
  
  const diff = now.getTime() - dateObj.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}
</script>

<style scoped>
.recent-dashboards {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.recent-dashboards__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.recent-dashboards__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.dashboard-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.dashboard-item:hover {
  background-color: var(--color-bg-secondary);
}

.dashboard-item__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.dashboard-item__content {
  flex: 1;
}

.dashboard-item__name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.dashboard-item__time {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.dashboard-item__link {
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast);
  white-space: nowrap;
}

.dashboard-item__link:hover {
  color: var(--color-primary-dark);
}

.recent-dashboards__empty {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.recent-dashboards__view-all {
  display: inline-block;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.recent-dashboards__view-all:hover {
  color: var(--color-primary-dark);
}
</style>
