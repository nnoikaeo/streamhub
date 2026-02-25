<script setup lang="ts">
/**
 * AdminAccordion Component
 * Collapsible admin menu section for UnifiedSidebar
 *
 * Features:
 * - Expandable/collapsible admin menu
 * - Smooth animations
 * - Active route detection
 * - Icons for each menu item
 * - Reusable pattern for other sections
 *
 * Usage:
 * <AdminAccordion
 *   v-model="isOpen"
 *   title="Admin Panel"
 *   :items="adminMenuItems"
 * />
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface MenuItem {
  path: string
  label: string
  icon: string
}

interface Props {
  /**
   * Accordion open/closed state (v-model)
   */
  modelValue: boolean

  /**
   * Accordion title
   */
  title?: string

  /**
   * Menu items
   */
  items: MenuItem[]

  /**
   * Allow to open/close (for disabled state)
   */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Admin Panel',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const route = useRoute()

// Computed for open state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Check if a menu item is active
 */
const isActive = (path: string): boolean => {
  return route.path.startsWith(path)
}

/**
 * Toggle accordion state
 */
const handleToggle = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

/**
 * Smooth expand/collapse animations
 */
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.opacity = '0'
  element.offsetHeight // Trigger reflow
  element.style.height = element.scrollHeight + 'px'
  element.style.opacity = '1'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.offsetHeight // Trigger reflow
  element.style.height = '0'
  element.style.opacity = '0'
}
</script>

<template>
  <section class="admin-accordion">
    <!-- Accordion Header -->
    <button
      class="accordion-header"
      :class="{ 'accordion-header--open': isOpen, 'accordion-header--disabled': disabled }"
      :disabled="disabled"
      @click="handleToggle"
      :aria-expanded="isOpen"
      :aria-label="`${title} menu`"
    >
      <svg
        class="accordion-icon"
        :class="{ 'accordion-icon--open': isOpen }"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M8.59 16.58L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
      </svg>
      <span class="accordion-title">{{ title }}</span>
      <span v-if="$slots.header" class="accordion-header-slot">
        <slot name="header" />
      </span>
    </button>

    <!-- Accordion Content (with animation) -->
    <Transition
      name="accordion-expand"
      @enter="onEnter"
      @leave="onLeave"
    >
      <nav v-if="isOpen" class="accordion-content">
        <!-- Menu Items -->
        <NuxtLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          :class="['accordion-item', { 'accordion-item--active': isActive(item.path) }]"
        >
          <span class="accordion-item__icon">{{ item.icon }}</span>
          <span class="accordion-item__label">{{ item.label }}</span>
        </NuxtLink>

        <!-- Slot for additional content -->
        <slot name="items" />
      </nav>
    </Transition>
  </section>
</template>

<style scoped>
/* ========== ACCORDION SECTION ========== */
.admin-accordion {
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
  background-color: var(--color-bg-primary, #ffffff);
}

/* ========== ACCORDION HEADER ========== */
.accordion-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  padding: var(--spacing-md, 1rem);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
  font-size: inherit;
  font-family: inherit;
}

.accordion-header:hover:not(.accordion-header--disabled) {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-primary, #3b82f6);
}

.accordion-header--open:not(.accordion-header--disabled) {
  background-color: rgba(59, 130, 246, 0.08);
  color: var(--color-primary, #3b82f6);
  border-radius: var(--radius-md, 0.375rem);
}

.accordion-header--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accordion-header:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.accordion-header:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: -2px;
}

/* ========== ACCORDION ICON ========== */
.accordion-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  transition: transform var(--transition-base, 0.2s ease);
  transform: rotate(-90deg);
}

.accordion-icon--open {
  transform: rotate(0deg);
}

/* ========== ACCORDION TITLE ========== */
.accordion-title {
  font-weight: 600;
  font-size: 0.9375rem;
  flex: 1;
  text-align: left;
}

/* ========== ACCORDION HEADER SLOT ========== */
.accordion-header-slot {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.25rem);
  flex-shrink: 0;
}

/* ========== ACCORDION CONTENT ========== */
.accordion-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: var(--color-bg-secondary, #f3f4f6);
  padding: var(--spacing-sm, 0.5rem) 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ========== ACCORDION ITEMS ========== */
.accordion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.25rem);
  color: var(--color-text-secondary, #6b7280);
  text-decoration: none;
  transition: all var(--transition-base, 0.2s ease);
  font-size: 0.9375rem;
}

.accordion-item:hover {
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-primary, #3b82f6);
  padding-left: calc(var(--spacing-lg, 1.25rem) + 0.25rem);
}

.accordion-item--active {
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-primary, #3b82f6);
  font-weight: 600;
  border-left: 3px solid var(--color-primary, #3b82f6);
  padding-left: calc(var(--spacing-lg, 1.25rem) - 0.25rem);
}

.accordion-item:focus {
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.accordion-item:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
}

/* ========== ACCORDION ITEM ICON ========== */
.accordion-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* ========== ACCORDION ITEM LABEL ========== */
.accordion-item__label {
  flex: 1;
}

/* ========== TRANSITIONS ========== */
.accordion-expand-enter-active,
.accordion-expand-leave-active {
  overflow: hidden;
  transition: all var(--transition-base, 0.2s ease);
}

.accordion-expand-enter-from {
  height: 0 !important;
  opacity: 0 !important;
}

.accordion-expand-leave-to {
  height: 0 !important;
  opacity: 0 !important;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .accordion-header {
    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  }

  .accordion-item {
    padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 1rem);
  }

  .accordion-title {
    font-size: 0.875rem;
  }

  .accordion-item__label {
    font-size: 0.875rem;
  }
}
</style>
