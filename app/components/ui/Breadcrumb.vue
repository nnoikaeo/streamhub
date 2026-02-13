<template>
  <nav class="breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in items" :key="`breadcrumb-${index}`" class="breadcrumb-item">
        <!-- Link -->
        <a
          v-if="item.to"
          class="breadcrumb-link"
          :href="item.to"
          @click.prevent="$emit('navigate', item.to)"
        >
          {{ item.label }}
        </a>

        <!-- Text (Current page) -->
        <span v-else class="breadcrumb-current">
          {{ item.label }}
        </span>

        <!-- Separator -->
        <span v-if="index < items.length - 1" class="breadcrumb-separator">
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
/**
 * Breadcrumb Component - Navigation breadcrumb trail
 *
 * Features:
 * - Clickable navigation items
 * - Current page indicator (last item)
 * - Custom separator
 * - Semantic HTML (nav + ol)
 * - Keyboard accessible
 *
 * Usage:
 * <Breadcrumb
 *   :items="[
 *     { label: 'Home', to: '/' },
 *     { label: 'Dashboard', to: '/dashboard' },
 *     { label: 'Sales', to: null } // Current page
 *   ]"
 *   @navigate="handleNavigation"
 * />
 */

interface BreadcrumbItem {
  label: string
  to?: string | null
}

defineProps({
  /**
   * Array of breadcrumb items
   * Last item without 'to' is treated as current page
   */
  items: {
    type: Array as () => BreadcrumbItem[],
    required: true,
    validator: (items: BreadcrumbItem[]) => items.length > 0,
  },

  /**
   * Separator between items
   */
  separator: {
    type: String,
    default: '/',
  },
})

defineEmits<{
  navigate: [to: string]
}>()
</script>

<style scoped>
.breadcrumb {
  font-size: 0.875rem;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Breadcrumb Link */
.breadcrumb-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 0.25rem 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    color: #1d4ed8;
    background-color: #eff6ff;
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  &:active {
    color: #1e40af;
  }
}

/* Current Page (Last Item) */
.breadcrumb-current {
  color: #6b7280;
  font-weight: 600;
}

/* Separator */
.breadcrumb-separator {
  color: #d1d5db;
  margin: 0 0.25rem;
  user-select: none;
}

/* Responsive */
@media (max-width: 768px) {
  .breadcrumb-list {
    font-size: 0.75rem;
  }

  .breadcrumb-item {
    gap: 0.125rem;
  }

  .breadcrumb-separator {
    margin: 0 0.125rem;
  }
}
</style>
