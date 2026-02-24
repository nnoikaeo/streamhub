<script setup lang="ts">
/**
 * FolderAccordion Component
 * Collapsible folder section for UnifiedSidebar
 *
 * Features:
 * - Expandable/collapsible folder tree
 * - Smooth animations
 * - Wraps FolderSidebar component
 * - Reusable pattern for collapsible sections
 *
 * Usage:
 * <FolderAccordion
 *   v-model="isOpen"
 *   :folders="folders"
 *   :allow-search="true"
 *   :allow-create="false"
 *   @select-folder="handleSelectFolder"
 * />
 */

import { computed } from 'vue'
import type { Folder } from '~/types/dashboard'
import FolderSidebar from '~/components/features/FolderSidebar.vue'

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
   * Folder array
   */
  folders: Folder[]

  /**
   * Currently selected folder ID
   */
  selectedFolderId?: string | null

  /**
   * Allow folder search
   */
  allowSearch?: boolean

  /**
   * Allow create folder button
   */
  allowCreate?: boolean

  /**
   * Allow to open/close (for disabled state)
   */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'โฟลเดอร์',
  selectedFolderId: null,
  allowSearch: true,
  allowCreate: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select-folder': [folder: Folder]
  'create-folder': []
}>()

// Computed for open state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Toggle accordion state
 */
const handleToggle = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

/**
 * Forward FolderSidebar events
 */
const handleSelectFolder = (folder: Folder) => {
  emit('select-folder', folder)
}

const handleCreateFolder = () => {
  emit('create-folder')
}

/**
 * Navigate to discover page with all dashboards
 */
const navigateToDiscoverAll = () => {
  navigateTo('/dashboard/discover')
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

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  // Remove height constraint after animation so content can grow naturally
  element.style.height = 'auto'
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
  <section class="folder-accordion">
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
    </button>

    <!-- Accordion Content (with animation) -->
    <Transition
      name="accordion-expand"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
    >
      <div v-if="isOpen" class="accordion-content">
        <!-- FolderSidebar wrapped inside accordion -->
        <FolderSidebar
          :folders="folders"
          :selected-folder-id="selectedFolderId"
          :show-main-menu="false"
          :show-folders="true"
          :allow-search="allowSearch"
          :allow-create="allowCreate"
          @select-folder="handleSelectFolder"
          @create-folder="handleCreateFolder"
        />

        <!-- View All Dashboards Button -->
        <div class="accordion-footer">
          <button
            class="view-all-button"
            @click="navigateToDiscoverAll"
            title="View all dashboards without folder filter"
          >
            <span class="view-all-icon">📊</span>
            <span class="view-all-label">ดูแดชบอร์ดทั้งหมด</span>
          </button>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
/* ========== ACCORDION SECTION ========== */
.folder-accordion {
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
  background-color: var(--color-bg-primary);
  color: var(--color-info-light, #3b82f6);
  border-left: 3px solid var(--color-primary, #3b82f6);
  border-radius: var(--radius-md, 0.375rem);
  padding-left: calc(var(--spacing-md, 1rem) - 3px);
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

/* ========== ACCORDION CONTENT ========== */
.accordion-content {
  background-color: var(--color-bg-secondary, #f3f4f6);
  overflow-y: auto;
  overflow-x: hidden;
  /* Allow content to expand without height constraint */
  /* Height is controlled by animation, then set to auto after */
  min-height: auto;
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

/* ========== ACCORDION FOOTER ========== */
.accordion-footer {
  padding: var(--spacing-md, 1rem);
  border-top: 1px solid var(--color-border-light, #e5e7eb);
  background-color: var(--color-bg-secondary, #f3f4f6);
}

/* ========== VIEW ALL BUTTON ========== */
.view-all-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background-color: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.view-all-button:hover {
  background-color: var(--color-info-light, #eff6ff);
  border-color: var(--color-info, #3b82f6);
  color: var(--color-info, #3b82f6);
}

.view-all-button:active {
  transform: scale(0.98);
}

.view-all-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.view-all-button:focus-visible {
  outline: 2px solid var(--color-info, #3b82f6);
  outline-offset: -2px;
}

/* ========== VIEW ALL ICON & LABEL ========== */
.view-all-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 1rem;
  flex-shrink: 0;
}

.view-all-label {
  flex: 1;
  text-align: left;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .accordion-header {
    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  }

  .accordion-title {
    font-size: 0.875rem;
  }

  .accordion-footer {
    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  }

  .view-all-button {
    padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
    font-size: 0.75rem;
  }

  .view-all-icon {
    width: 1rem;
    height: 1rem;
    font-size: 0.875rem;
  }
}
</style>
