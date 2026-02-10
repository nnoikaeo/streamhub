<template>
  <div class="card" :class="{ 'card-interactive': interactive }">
    <!-- Card Header (Optional) -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <slot />
    </div>

    <!-- Card Footer (Optional) -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Card Component - Container component with header/body/footer slots
 *
 * Features:
 * - Optional header section
 * - Main body content area
 * - Optional footer section
 * - Interactive state (hover effects)
 * - Flexible padding options
 *
 * Usage:
 * <Card>
 *   <template #header>
 *     <h3>Card Title</h3>
 *   </template>
 *   <p>Card content goes here</p>
 *   <template #footer>
 *     <Button>Action</Button>
 *   </template>
 * </Card>
 */

defineProps({
  /**
   * Interactive mode - shows hover effects
   */
  interactive: {
    type: Boolean,
    default: false,
  },

  /**
   * Padding size
   */
  padding: {
    type: String as () => 'sm' | 'md' | 'lg',
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<style scoped>
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-fast);
}

/* Interactive state */
.card-interactive {
  cursor: pointer;

  &:hover {
    border-color: var(--color-border-default);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

/* Card Header */
.card-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-bg-secondary);

  &:empty {
    display: none;
  }
}

/* Card Body */
.card-body {
  padding: 1rem;

  &:only-child {
    background-color: var(--color-bg-primary);
  }
}

/* Card Footer */
.card-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-bg-secondary);

  &:empty {
    display: none;
  }
}

/* Padding variants */
.card {
  &.padding-sm .card-header,
  &.padding-sm .card-body,
  &.padding-sm .card-footer {
    padding: 0.75rem;
  }

  &.padding-lg .card-header,
  &.padding-lg .card-body,
  &.padding-lg .card-footer {
    padding: 1.5rem;
  }
}
</style>
