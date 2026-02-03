<template>
  <span class="badge" :class="`badge-${variant}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * Badge Component - Status indicator component
 *
 * Variants (semantic):
 * - default (gray)
 * - success (green)
 * - warning (yellow)
 * - danger (red)
 * - info (blue)
 * - primary (blue variant)
 *
 * Features:
 * - Semantic color variants
 * - Compact size for inline use
 * - Rounded pill style
 * - Text content via slot
 *
 * Usage:
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Failed</Badge>
 */

defineProps({
  /**
   * Badge variant/style
   */
  variant: {
    type: String as () =>
      | 'default'
      | 'success'
      | 'warning'
      | 'danger'
      | 'info'
      | 'primary',
    default: 'default',
    validator: (v: string) =>
      [
        'default',
        'success',
        'warning',
        'danger',
        'info',
        'primary',
      ].includes(v),
  },
})
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
  text-transform: capitalize;
  letter-spacing: 0.02em;
}

/* Default: Gray */
.badge-default {
  background-color: #e5e7eb;
  color: #374151;
}

/* Success: Green */
.badge-success {
  background-color: #dcfce7;
  color: #166534;
}

/* Warning: Yellow */
.badge-warning {
  background-color: #fef08a;
  color: #854d0e;
}

/* Danger: Red */
.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Info: Blue */
.badge-info {
  background-color: #dbeafe;
  color: #0c4a6e;
}

/* Primary: Blue */
.badge-primary {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
