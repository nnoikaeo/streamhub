<script setup lang="ts">
/**
 * GroupForm Component (Refactored)
 * Form for creating and editing groups in admin panel
 *
 * Features:
 * - Fields: ID, Name, Description, Members (multi-select)
 * - Validation: Required fields
 * - ID field disabled in edit mode
 * - Multi-select members with search/filter
 * - Uses FormField component for consistent styling
 */

import type { User } from '~/types/dashboard'
import { mockUsers } from '~/composables/useMockData'
import { createObjectValidator, validators } from '~/utils/formValidators'

interface GroupData {
  id: string
  name: string
  description: string
  members: string[]
}

interface Props {
  group?: GroupData | null
  members?: User[]
}

const props = withDefaults(defineProps<Props>(), {
  members: () => mockUsers,
})

const emit = defineEmits<{
  submit: [data: Partial<GroupData>]
}>()

// Member search
const memberSearch = ref('')

// Form validation
const validate = createObjectValidator({
  id: [
    (value) => validators.required(value, 'รหัสกลุ่ม'),
    (value) => validators.minLength(2, 'รหัสกลุ่ม')(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อกลุ่ม')],
})

const form = useForm({
  initialValues: {
    id: props.group?.id || '',
    name: props.group?.name || '',
    description: props.group?.description || '',
    members: props.group?.members || [],
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

// Computed values
const isEditMode = computed(() => !!props.group)

const availableMembers = computed(() =>
  props.members.filter((user) => {
    if (!memberSearch.value) return true
    const search = memberSearch.value.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search)
    )
  })
)

const selectedMembersCount = computed(() => form.formData.members.length)

// Member selection helpers
const toggleMember = (uid: string) => {
  const members = form.formData.members as string[]
  const index = members.indexOf(uid)
  if (index === -1) {
    members.push(uid)
  } else {
    members.splice(index, 1)
  }
}

const isMemberSelected = (uid: string): boolean => {
  return (form.formData.members as string[]).includes(uid)
}

const selectAll = () => {
  const members = form.formData.members as string[]
  for (const user of availableMembers.value) {
    if (!members.includes(user.uid)) {
      members.push(user.uid)
    }
  }
}

const deselectAll = () => {
  const members = form.formData.members as string[]
  for (const user of availableMembers.value) {
    const index = members.indexOf(user.uid)
    if (index !== -1) {
      members.splice(index, 1)
    }
  }
}
</script>

<template>
  <form @submit.prevent="form.handleSubmit" class="group-form">
    <FormField
      v-model="form.formData.id"
      type="text"
      label="รหัสกลุ่ม (ID)"
      placeholder="เช่น sales"
      :error="form.errors.id"
      :disabled="isEditMode"
      :required="true"
      :description="!isEditMode ? 'รหัสกลุ่ม ไม่สามารถเปลี่ยนแปลงหลังสร้างได้' : undefined"
      @blur="form.setFieldTouched('id')"
    />

    <FormField
      v-model="form.formData.name"
      type="text"
      label="ชื่อกลุ่ม (Name)"
      placeholder="เช่น Sales Team"
      :error="form.errors.name"
      :required="true"
      @blur="form.setFieldTouched('name')"
    />

    <FormField
      v-model="form.formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้"
      :rows="3"
    />

    <!-- Members Field -->
    <div class="form-field">
      <div class="members-header">
        <label class="form-label">สมาชิก ({{ selectedMembersCount }})</label>
        <div class="members-actions">
          <button type="button" class="members-action-btn" @click="selectAll">
            เลือกทั้งหมด
          </button>
          <button type="button" class="members-action-btn" @click="deselectAll">
            ยกเลิกทั้งหมด
          </button>
        </div>
      </div>

      <input
        v-model="memberSearch"
        type="text"
        class="form-input"
        placeholder="ค้นหาผู้ใช้ (อีเมล หรือ ชื่อ)"
      />

      <div class="members-container">
        <label v-for="user in availableMembers" :key="user.uid" class="member-checkbox">
          <input
            type="checkbox"
            :checked="isMemberSelected(user.uid)"
            @change="toggleMember(user.uid)"
            class="member-checkbox__input"
          />
          <div class="member-info">
            <span class="member-name">{{ user.name }}</span>
            <span class="member-email">{{ user.email }}</span>
            <span class="member-role">{{ user.role }}</span>
          </div>
        </label>

        <div v-if="availableMembers.length === 0" class="members-empty">
          ไม่พบผู้ใช้ที่ตรงกับการค้นหา
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.group-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.form-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
}

.form-input {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-primary, #1f2937);
  transition: all var(--transition-base, 0.2s ease);
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Members Header */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.members-actions {
  display: flex;
  gap: var(--spacing-xs, 0.25rem);
}

.members-action-btn {
  padding: 0.375rem var(--spacing-sm, 0.5rem);
  font-size: 0.8rem;
  background-color: transparent;
  color: var(--color-primary, #3b82f6);
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: var(--radius-sm, 0.25rem);
  cursor: pointer;
  transition: all var(--transition-base, 0.2s ease);
}

.members-action-btn:hover {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

/* Members Container */
.members-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-md, 1rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
  border: 1px solid var(--color-border-light, #e5e7eb);
  max-height: 300px;
  overflow-y: auto;
}

/* Member Checkbox */
.member-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem);
  cursor: pointer;
  border-radius: var(--radius-sm, 0.25rem);
  transition: background-color var(--transition-base, 0.2s ease);
}

.member-checkbox:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.member-checkbox__input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
  flex-shrink: 0;
}

/* Member Info */
.member-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  flex: 1;
}

.member-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
}

.member-email {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
}

.member-role {
  font-size: 0.75rem;
  padding: 0.125rem var(--spacing-xs, 0.25rem);
  background-color: var(--color-bg-primary, #ffffff);
  color: var(--color-text-secondary, #6b7280);
  border-radius: var(--radius-sm, 0.25rem);
  width: fit-content;
  font-weight: 500;
}

/* Empty State */
.members-empty {
  padding: var(--spacing-lg, 1.25rem);
  text-align: center;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 640px) {
  .members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm, 0.5rem);
  }

  .members-actions {
    width: 100%;
  }

  .members-action-btn {
    flex: 1;
  }
}
</style>
