<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      {
        'btn-disabled': disabled,
        'btn-loading': loading,
        'btn-icon-only': iconOnly,
      },
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click')"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="btn-spinner">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke-width="3" />
      </svg>
    </span>

    <!-- Icon (before text) -->
    <span v-if="$slots.icon && !iconOnly" class="btn-icon btn-icon-before">
      <slot name="icon" />
    </span>

    <!-- Icon only (no text) -->
    <span v-if="iconOnly && $slots.icon" class="btn-icon">
      <slot name="icon" />
    </span>

    <!-- Text content -->
    <span v-if="!iconOnly && $slots.default" class="btn-text">
      <slot />
    </span>

    <!-- Icon (after text) -->
    <span v-if="$slots.iconAfter && !iconOnly" class="btn-icon btn-icon-after">
      <slot name="iconAfter" />
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * Button Component - Reusable button with variants and sizes
 *
 * Variants:
 * - primary (blue, main action)
 * - secondary (gray, alternative action)
 * - danger (red, destructive action)
 * - ghost (transparent, minimal)
 *
 * Sizes:
 * - sm (small, compact)
 * - md (medium, default)
 * - lg (large, prominent)
 *
 * Features:
 * - Icon support (before/after text)
 * - Loading state with spinner
 * - Icon-only mode
 * - Disabled state
 * - Type support (button, submit, reset)
 */

defineProps({
  /**
   * Button variant/style
   * @values primary, secondary, danger, ghost
   */
  variant: {
    type: String as () => 'primary' | 'secondary' | 'danger' | 'ghost',
    default: 'primary',
    validator: (v: string) => ['primary', 'secondary', 'danger', 'ghost'].includes(v),
  },

  /**
   * Button size
   * @values sm, md, lg
   */
  size: {
    type: String as () => 'sm' | 'md' | 'lg',
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v),
  },

  /**
   * Button HTML type
   */
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button',
  },

  /**
   * Disabled state
   */
  disabled: {
    type: Boolean,
    default: false,
  },

  /**
   * Loading state with spinner
   */
  loading: {
    type: Boolean,
    default: false,
  },

  /**
   * Show only icon, hide text
   */
  iconOnly: {
    type: Boolean,
    default: false,
  },
})

defineEmits<{
  click: []
}>()
</script>

<style scoped>
/* ========== BASE STYLES ========== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
  position: relative;

  &:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

/* ========== SIZES ========== */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  min-height: 2rem;
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  line-height: 1.5rem;
  min-height: 2.5rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  min-height: 3rem;
}

/* Icon-only buttons (square shape) */
.btn-icon-only {
  padding: 0;

  &.btn-sm {
    width: 2rem;
    height: 2rem;
  }

  &.btn-md {
    width: 2.5rem;
    height: 2.5rem;
  }

  &.btn-lg {
    width: 3rem;
    height: 3rem;
  }
}

/* ========== VARIANTS ========== */

/* Primary: Blue background */
.btn-primary {
  background-color: #3b82f6;
  color: #ffffff;

  &:hover:not(.btn-disabled) {
    background-color: #2563eb;
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
  }

  &:active:not(.btn-disabled) {
    background-color: #1d4ed8;
  }

  &:focus-visible {
    outline-color: #3b82f6;
  }
}

/* Secondary: Gray background */
.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;

  &:hover:not(.btn-disabled) {
    background-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(209, 213, 219, 0.3);
  }

  &:active:not(.btn-disabled) {
    background-color: #9ca3af;
  }

  &:focus-visible {
    outline-color: #6b7280;
  }
}

/* Danger: Red background */
.btn-danger {
  background-color: #ef4444;
  color: #ffffff;

  &:hover:not(.btn-disabled) {
    background-color: #dc2626;
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
  }

  &:active:not(.btn-disabled) {
    background-color: #b91c1c;
  }

  &:focus-visible {
    outline-color: #ef4444;
  }
}

/* Ghost: Transparent background, border */
.btn-ghost {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;

  &:hover:not(.btn-disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #1f2937;
  }

  &:active:not(.btn-disabled) {
    background-color: #f3f4f6;
  }

  &:focus-visible {
    outline-color: #6b7280;
  }
}

/* ========== STATES ========== */

/* Disabled state */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
.btn-loading {
  cursor: wait;
}

/* ========== ICONS ========== */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;

  :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.btn-icon-before {
  margin-right: -0.25rem;
}

.btn-icon-after {
  margin-left: -0.25rem;
}

/* ========== LOADING SPINNER ========== */
.btn-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
  animation: spin 1s linear infinite;

  circle {
    stroke-dasharray: 60;
    stroke-dashoffset: 0;
    animation: spin 1.5s ease-in-out infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-text {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.btn-loading .btn-text {
  opacity: 0;
}

/* ========== TEXT STYLING ========== */
.btn-text {
  font-weight: 500;
  letter-spacing: 0.01em;
}
</style>
