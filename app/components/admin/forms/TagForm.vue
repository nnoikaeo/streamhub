<script setup lang="ts">
/**
 * TagForm Component
 * Form for creating and editing tags in admin panel
 *
 * Features:
 * - Fields: name, slug (auto-generated), color (8 preset swatches), description, isActive
 * - Slug auto-generated from name but editable
 * - TagBadge preview
 * - Validation: name required
 */

import { computed, watch } from 'vue'
import type { Tag } from '~/types/tag'
import { createObjectValidator, validators } from '~/utils/formValidators'
import TagBadge from '~/components/features/TagBadge.vue'

interface Props {
  tag?: Tag | null
  nextSortOrder?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<Tag>]
}>()

const PRESET_COLORS = [
  '#F59E0B',
  '#3B82F6',
  '#10B981',
  '#F97316',
  '#8B5CF6',
  '#6B7280',
  '#06B6D4',
  '#EC4899',
]

const validate = createObjectValidator({
  name: [(value) => validators.required(value, 'ชื่อแท็ก')],
})

const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    name: props.tag?.name || '',
    slug: props.tag?.slug || '',
    color: props.tag?.color || PRESET_COLORS[0],
    description: props.tag?.description || '',
    sortOrder: props.tag?.sortOrder ?? props.nextSortOrder ?? 0,
    isActive: props.tag?.isActive ?? true,
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

// Auto-generate slug from name (only when not in edit mode or slug hasn't been manually changed)
const autoSlug = computed(() =>
  (formData.name as string)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
)

watch(() => formData.name as string, () => {
  if (!props.tag) {
    formData.slug = autoSlug.value
  }
})

// Preview tag object for TagBadge
const previewTag = computed<Tag>(() => ({
  id: 'preview',
  name: (formData.name as string) || 'Preview',
  slug: (formData.slug as string) || 'preview',
  color: (formData.color as string) || PRESET_COLORS[0],
  description: (formData.description as string) || '',
  createdBy: '',
  isActive: formData.isActive as boolean,
  createdAt: '',
  updatedAt: '',
}))

defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="tag-form">
    <!-- Name -->
    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อแท็ก"
      placeholder="เช่น Sales"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <!-- Slug -->
    <FormField
      v-model="formData.slug"
      type="text"
      label="Slug"
      placeholder="เช่น sales"
      description="ใช้สำหรับอ้างอิงภายใน (auto-generate จากชื่อ)"
    />

    <!-- Color Swatches -->
    <div class="tag-form__field">
      <label class="tag-form__label">สี</label>
      <div class="tag-form__swatches">
        <button
          v-for="color in PRESET_COLORS"
          :key="color"
          type="button"
          class="swatch"
          :class="{ 'swatch--selected': formData.color === color }"
          :style="{ backgroundColor: color }"
          :title="color"
          @click="formData.color = color"
        />
      </div>
    </div>

    <!-- Description -->
    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับแท็กนี้"
      :rows="2"
    />

    <FormField
      v-model="formData.sortOrder"
      type="number"
      label="ลำดับการแสดงผล (Sort Order)"
      placeholder="เช่น 1, 2, 3"
      :disabled="true"
      description="ปรับลำดับได้ด้วยปุ่ม ⬆️ / ⬇️ ในหน้าจัดการแท็ก"
    />

    <!-- isActive toggle -->
    <div class="tag-form__field tag-form__field--inline">
      <label class="tag-form__label">สถานะ</label>
      <label class="tag-form__toggle">
        <input
          v-model="formData.isActive"
          type="checkbox"
          class="tag-form__toggle-input"
        />
        <span class="tag-form__toggle-label">
          {{ formData.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
        </span>
      </label>
    </div>

    <!-- Preview -->
    <div class="tag-form__preview">
      <span class="tag-form__preview-label">ตัวอย่าง</span>
      <TagBadge :tag="previewTag" size="md" />
    </div>
  </div>
</template>

<style scoped>
.tag-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
}

.tag-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.tag-form__field--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-md, 1rem);
}

.tag-form__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tag-form__swatches {
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
  flex-wrap: wrap;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
  padding: 0;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch--selected {
  border-color: var(--color-text-primary);
  transform: scale(1.15);
}

.tag-form__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  cursor: pointer;
}

.tag-form__toggle-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.tag-form__toggle-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.tag-form__preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 1rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.tag-form__preview-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}
</style>
