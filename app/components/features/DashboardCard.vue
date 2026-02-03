<template>
  <Card interactive class="dashboard-card">
    <!-- Card Header with Actions -->
    <template #header>
      <div class="card-header-content">
        <div class="dashboard-info">
          <h3 class="dashboard-title">{{ dashboard.name }}</h3>
          <p class="dashboard-description">{{ dashboard.description }}</p>
        </div>
        <div class="dashboard-actions">
          <button class="action-btn" type="button" @click="$emit('share')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button class="action-btn" type="button" @click="$emit('menu')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Card Body: Dashboard Preview -->
    <div class="dashboard-preview" @click="$emit('view')">
      <div class="preview-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <span>{{ dashboard.type }}</span>
      </div>
    </div>

    <!-- Card Footer: Metadata -->
    <template #footer>
      <div class="card-footer-content">
        <div class="dashboard-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.3-2.89-4.04 5.09h17L13.96 9.29z" />
            </svg>
            <span class="text-xs text-gray-600">Updated: {{ formatDate(dashboard.updatedAt) }}</span>
          </span>
        </div>
        <Badge v-if="dashboard.public" variant="success">Public</Badge>
        <Badge v-else variant="default">Private</Badge>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { type Dashboard } from '~/types/dashboard'
import Card from '~/components/ui/Card.vue'
import Badge from '~/components/ui/Badge.vue'

/**
 * DashboardCard - Individual dashboard preview card
 *
 * Features:
 * - Dashboard preview with thumbnail placeholder
 * - Title, description, and metadata
 * - Quick actions (share, menu)
 * - Public/private status badge
 * - Click to view dashboard
 * - Interactive hover effects
 *
 * Events:
 * - view: User clicked on card
 * - share: User clicked share button
 * - menu: User clicked menu (options)
 *
 * Usage:
 * <DashboardCard
 *   :dashboard="dashboardObject"
 *   @view="navigateToDashboard"
 *   @share="showShareDialog"
 *   @menu="showContextMenu"
 * />
 */

defineProps({
  /**
   * Dashboard object to display
   */
  dashboard: {
    type: Object as () => Dashboard,
    required: true,
  },
})

defineEmits<{
  view: []
  share: []
  menu: []
}>()

/**
 * Format date for display
 */
const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : '2-digit',
  })
}
</script>

<style scoped>
.dashboard-card {
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

/* ========== HEADER ========== */
.card-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-info {
  flex: 1;
}

.dashboard-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.dashboard-description {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========== ACTIONS ========== */
.dashboard-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background-color: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #1f2937;
  }

  &:active {
    background-color: #e5e7eb;
  }
}

/* ========== PREVIEW ========== */
.dashboard-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #d1d5db;

  svg {
    width: 2rem;
    height: 2rem;
  }

  span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
}

.dashboard-card:hover .dashboard-preview {
  background-color: #f3f4f6;

  .preview-placeholder {
    color: #9ca3af;
  }
}

/* ========== FOOTER ========== */
.card-footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-meta {
  flex: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}
</style>
