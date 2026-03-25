<script setup lang="ts">
export type GroupByMode = 'folder' | 'tag' | 'company' | 'none'

const props = withDefaults(defineProps<{
  modelValue: GroupByMode
  showFolders?: boolean
  isAdmin?: boolean
}>(), {
  showFolders: true,
  isAdmin: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: GroupByMode]
}>()

const set = (mode: GroupByMode) => emit('update:modelValue', mode)
</script>

<template>
  <div class="group-by-switcher" role="group" aria-label="จัดกลุ่มตาม">
    <!-- Folder -->
    <button
      v-if="showFolders"
      type="button"
      class="group-by-btn"
      :class="{ active: modelValue === 'folder' }"
      title="จัดกลุ่มตามโฟลเดอร์"
      aria-label="จัดกลุ่มตามโฟลเดอร์"
      @click="set('folder')"
    >
      <!-- Folder icon -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    </button>

    <!-- Tag -->
    <button
      type="button"
      class="group-by-btn"
      :class="{ active: modelValue === 'tag' }"
      title="จัดกลุ่มตามแท็ก"
      aria-label="จัดกลุ่มตามแท็ก"
      @click="set('tag')"
    >
      <!-- Tag icon -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    </button>

    <!-- Company (admin only) -->
    <button
      v-if="isAdmin"
      type="button"
      class="group-by-btn"
      :class="{ active: modelValue === 'company' }"
      title="จัดกลุ่มตามบริษัท"
      aria-label="จัดกลุ่มตามบริษัท"
      @click="set('company')"
    >
      <!-- Building/Company icon -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <rect x="3" y="3" width="7" height="18" />
        <rect x="14" y="9" width="7" height="12" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
        <line x1="7" y1="11" x2="7.01" y2="11" />
        <line x1="7" y1="15" x2="7.01" y2="15" />
        <line x1="18" y1="13" x2="18.01" y2="13" />
        <line x1="18" y1="17" x2="18.01" y2="17" />
      </svg>
    </button>

    <!-- None (no grouping) -->
    <button
      type="button"
      class="group-by-btn"
      :class="{ active: modelValue === 'none' }"
      title="ไม่จัดกลุ่ม"
      aria-label="ไม่จัดกลุ่ม"
      @click="set('none')"
    >
      <!-- Flat list icon (3 equal lines, no indent) -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.group-by-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  padding: 2px;
}

.group-by-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.group-by-btn:hover {
  color: var(--color-text-primary, #1f2937);
  background: var(--color-bg-primary, #ffffff);
}

.group-by-btn.active {
  background: var(--color-primary, #3b82f6);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
