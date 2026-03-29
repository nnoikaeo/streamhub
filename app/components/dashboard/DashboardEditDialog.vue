<script setup lang="ts">
/**
 * DashboardEditDialog
 * Modal dialog for editing dashboard name, description, and tags.
 * Uses FormModal + FormField pattern consistent with the project.
 */
import { ref, watch } from 'vue'
import type { Dashboard } from '~/types/dashboard'
import { useTagStore } from '~/stores/tags'
import FormModal from '~/components/ui/FormModal.vue'
import FormField from '~/components/forms/FormField.vue'

interface Props {
  modelValue: boolean
  dashboard: Dashboard
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [dashboard: Dashboard]
}>()

const tagStore = useTagStore()

// Form state
const name = ref('')
const description = ref('')
const selectedTags = ref<string[]>([])
const isSaving = ref(false)
const nameError = ref('')

// Sync form state when dialog opens or dashboard changes
watch(
  () => [props.modelValue, props.dashboard] as const,
  ([isOpen, dash]) => {
    if (isOpen && dash) {
      name.value = dash.name || ''
      description.value = dash.description || ''
      selectedTags.value = [...(dash.tags || [])]
      nameError.value = ''
    }
  },
  { immediate: true },
)

const validate = (): boolean => {
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = 'กรุณาระบุชื่อแดชบอร์ด'
    return false
  }
  return true
}

const toggleTag = (tagId: string) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const handleSave = async () => {
  if (!validate()) return

  isSaving.value = true
  try {
    const updated: Dashboard = {
      ...props.dashboard,
      name: name.value.trim(),
      description: description.value.trim(),
      tags: selectedTags.value,
    }
    emit('saved', updated)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormModal
    :model-value="modelValue"
    title="แก้ไขข้อมูลแดชบอร์ด"
    :loading="isSaving"
    size="md"
    submit-text="บันทึก"
    cancel-text="ยกเลิก"
    @update:model-value="emit('update:modelValue', $event)"
    @save="handleSave"
    @cancel="handleCancel"
  >
    <div class="edit-form">
      <!-- Name -->
      <FormField
        v-model="name"
        type="text"
        label="ชื่อแดชบอร์ด"
        placeholder="ระบุชื่อแดชบอร์ด"
        :error="nameError"
        required
      />

      <!-- Description -->
      <FormField
        v-model="description"
        type="textarea"
        label="รายละเอียด"
        placeholder="ระบุรายละเอียด (ไม่บังคับ)"
        :rows="3"
      />

      <!-- Tags -->
      <div class="form-field">
        <label class="form-label">แท็ก</label>
        <div v-if="tagStore.activeTags.length > 0" class="tag-selector">
          <button
            v-for="tag in tagStore.activeTags"
            :key="tag.id"
            type="button"
            class="tag-chip"
            :class="{ 'tag-chip--selected': selectedTags.includes(tag.id) }"
            :style="selectedTags.includes(tag.id) ? `--chip-bg: ${tag.color}; --chip-border: ${tag.color}; --chip-color: #fff` : `--chip-bg: #fff; --chip-border: ${tag.color}; --chip-color: ${tag.color}`"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </button>
        </div>
        <p v-else class="tag-empty">ยังไม่มีแท็กในระบบ</p>
      </div>
    </div>
  </FormModal>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

button.tag-chip {
  padding: 0.25rem 0.75rem !important;
  border-radius: 9999px !important;
  border: 1.5px solid var(--chip-border) !important;
  font-size: 0.8125rem !important;
  cursor: pointer;
  transition: all 0.15s ease;
  background-color: var(--chip-bg) !important;
  color: var(--chip-color) !important;
}

button.tag-chip:hover {
  opacity: 0.85;
}

button.tag-chip.tag-chip--selected {
  font-weight: 600;
}

.tag-empty {
  color: var(--color-text-muted, #999);
  font-size: 0.875rem;
}
</style>
