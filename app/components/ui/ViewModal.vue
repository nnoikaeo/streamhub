<script setup lang="ts">
/**
 * ViewModal Component
 * Wraps Modal component for read-only detail views
 *
 * Features:
 * - Read-only display (no form, no save action)
 * - Single "ปิด" button in footer using theme-btn
 * - Uses existing Modal component for teleport & transitions
 *
 * Usage:
 * <ViewModal v-model="isOpen" title="รายละเอียด" size="lg">
 *   <!-- read-only content -->
 * </ViewModal>
 */

import { computed } from 'vue'

interface Props {
  /** Modal visibility (v-model) */
  modelValue: boolean
  /** Modal title */
  title: string
  /** Modal size (sm, md, lg, xl) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Close button text */
  closeText?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeText: 'ปิด',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <Modal
    :model-value="isOpen"
    :title="title"
    :size="size"
    @update:model-value="isOpen = $event"
  >
    <slot />

    <template #footer>
      <div class="view-modal__footer">
        <button
          type="button"
          class="theme-btn theme-btn--secondary"
          @click="isOpen = false"
        >
          {{ closeText }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.view-modal__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
