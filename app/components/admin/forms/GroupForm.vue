<script setup lang="ts">
/**
 * GroupForm Component
 * Form for creating and editing groups in admin panel
 *
 * Features:
 * - Fields: ID, Name, Description, Members (3-column selector)
 * - Validation: Required fields
 * - ID field disabled in edit mode
 * - 3-column member selector: Company → Users → Selected
 */

import type { User } from '~/types/dashboard'
import type { AdminGroup } from '~/types/admin'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { createObjectValidator, validators } from '~/utils/formValidators'
import { onMounted, computed, ref } from 'vue'

const getRoleLabel = (role: User['role']): string => {
  const labels: Record<User['role'], string> = {
    admin: 'Admin',
    moderator: 'Moderator',
    user: 'User',
  }
  return labels[role] ?? role
}

interface Props {
  group?: AdminGroup | null
  members?: User[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Partial<AdminGroup>]
}>()

// Composables
const { users, fetchUsers } = useAdminUsers()
const { companies, fetchCompanies } = useAdminCompanies()

// Use passed members or fetch from composable
const memberList = computed(() => props.members || users.value)

// Column 1: selected company filter (null = ทุกบริษัท)
const selectedCompany = ref<string | null>(null)

// Column 2: search within selected company
const memberSearch = ref('')

// Form validation
const validate = createObjectValidator({
  id: [
    (value) => validators.required(value, 'รหัสกลุ่ม'),
    (value) => validators.minLength(2, 'รหัสกลุ่ม')(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อกลุ่ม')],
})

const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    id: props.group?.id || '',
    name: props.group?.name || '',
    description: props.group?.description || '',
    members: [...(props.group?.members ?? [])] as string[],
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.group)

// Active companies list (for column 1)
const activeCompanies = computed(() =>
  companies.value.filter(c => c.isActive)
)

// Column 2: users filtered by selected company + search
const filteredUsers = computed(() => {
  let list = memberList.value

  if (selectedCompany.value) {
    list = list.filter(u => u.company === selectedCompany.value)
  }

  if (memberSearch.value) {
    const q = memberSearch.value.toLowerCase()
    list = list.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }

  // Exclude already selected
  return list.filter(u => !(formData.members as string[]).includes(u.uid))
})

// Column 3: selected members resolved to User objects
const selectedMembers = computed(() =>
  (formData.members as string[])
    .map(uid => memberList.value.find(u => u.uid === uid))
    .filter((u): u is User => !!u)
)

const selectedCount = computed(() => (formData.members as string[]).length)

const addMember = (uid: string) => {
  const members = formData.members as string[]
  if (!members.includes(uid)) members.push(uid)
}

const removeMember = (uid: string) => {
  const members = formData.members as string[]
  const i = members.indexOf(uid)
  if (i !== -1) members.splice(i, 1)
}

const clearAll = () => {
  (formData.members as string[]).splice(0)
}

onMounted(async () => {
  await Promise.all([
    fetchCompanies(),
    ...(props.members ? [] : [fetchUsers()]),
  ])
})

defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="group-form">
    <div class="group-form__row">
      <FormField
        v-model="formData.id"
        type="text"
        label="รหัสกลุ่ม (ID)"
        placeholder="เช่น sales"
        :error="errors.id"
        :disabled="isEditMode"
        :required="true"
        :description="!isEditMode ? 'ไม่สามารถเปลี่ยนแปลงหลังสร้าง' : undefined"
        @blur="setFieldTouched('id')"
      />

      <FormField
        v-model="formData.name"
        type="text"
        label="ชื่อกลุ่ม (Name)"
        placeholder="เช่น Sales Team"
        :error="errors.name"
        :required="true"
        @blur="setFieldTouched('name')"
      />
    </div>

    <FormField
      v-model="formData.description"
      type="textarea"
      label="คำอธิบาย"
      placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้"
      :rows="1"
    />

    <!-- 3-Column Member Selector -->
    <div class="member-selector">
      <div class="member-selector__label">
        สมาชิก
        <span class="member-selector__count">{{ selectedCount }} คนที่เลือก</span>
      </div>

      <div class="member-selector__panels">
        <!-- Column 1: Company -->
        <div class="panel panel--company">
          <div class="panel__header">บริษัท</div>
          <div class="panel__body">
            <button
              type="button"
              class="company-item"
              :class="{ 'company-item--active': selectedCompany === null }"
              @click="selectedCompany = null; memberSearch = ''"
            >
              ทั้งหมด
              <span class="company-item__count">{{ memberList.length }}</span>
            </button>
            <button
              v-for="company in activeCompanies"
              :key="company.code"
              type="button"
              class="company-item"
              :class="{ 'company-item--active': selectedCompany === company.code }"
              @click="selectedCompany = company.code; memberSearch = ''"
            >
              {{ company.code }}
              <span class="company-item__count">
                {{ memberList.filter(u => u.company === company.code).length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Column 2: Available Users -->
        <div class="panel panel--users">
          <div class="panel__header">
            บริษัท{{ selectedCompany ? ` · ${selectedCompany}` : '' }}
            <span class="panel__header-count">({{ filteredUsers.length }})</span>
          </div>
          <div class="panel__search">
            <input
              v-model="memberSearch"
              type="text"
              class="panel__search-input"
              placeholder="ค้นหาชื่อ หรืออีเมล..."
            />
          </div>
          <div class="panel__body">
            <button
              v-for="user in filteredUsers"
              :key="user.uid"
              type="button"
              class="user-item"
              @click="addMember(user.uid)"
            >
              <div class="user-item__info">
                <span class="user-item__name">{{ user.name }}</span>
                <span class="user-item__email">{{ getRoleLabel(user.role) }} · {{ user.company }}</span>
              </div>
              <span class="user-item__add">+</span>
            </button>
            <div v-if="filteredUsers.length === 0" class="panel__empty">
              {{ memberSearch ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'ไม่มีผู้ใช้ในบริษัทนี้' }}
            </div>
          </div>
        </div>

        <!-- Column 3: Selected Members -->
        <div class="panel panel--selected">
          <div class="panel__header">
            เลือกแล้ว
            <button
              v-if="selectedCount > 0"
              type="button"
              class="panel__clear-btn"
              @click="clearAll"
            >
              ล้างทั้งหมด
            </button>
          </div>
          <div class="panel__body">
            <div
              v-for="user in selectedMembers"
              :key="user.uid"
              class="selected-item"
            >
              <div class="selected-item__info">
                <span class="selected-item__name">{{ user.name }}</span>
                <span class="selected-item__company">{{ getRoleLabel(user.role) }} · {{ user.company }}</span>
              </div>
              <button
                type="button"
                class="selected-item__remove"
                @click="removeMember(user.uid)"
                aria-label="ลบสมาชิก"
              >
                ✕
              </button>
            </div>
            <div v-if="selectedCount === 0" class="panel__empty">
              คลิกผู้ใช้เพื่อเพิ่มสมาชิก
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
}

.group-form :deep(.form-textarea) {
  min-height: 56px;
}

.group-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md, 1rem);
}

/* ── Member Selector ── */
.member-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.member-selector__label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.member-selector__count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: var(--color-primary-lightest);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.member-selector__panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 340px;
}

/* ── Panel shared ── */
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-bg-primary);
}

.panel + .panel {
  border-left: 1px solid var(--color-border-default);
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-default);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.panel__header-count {
  font-weight: 400;
}

.panel__search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  background-color: var(--color-bg-primary);
}

.panel__search-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: inherit;
}

.panel__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-lightest);
}

.panel__body {
  flex: 1;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-dark) var(--color-bg-secondary);
}

.panel__empty {
  padding: 1.5rem 0.75rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.panel__clear-btn {
  font-size: 0.75rem;
  color: var(--color-error);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.panel__clear-btn:hover {
  text-decoration: underline;
}

/* ── Column 1: Company ── */
.company-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
  font-family: inherit;
}

.company-item:hover:not(.company-item--active) {
  background-color: var(--color-bg-secondary);
}

.company-item--active {
  background-color: var(--color-primary-lightest);
  color: var(--color-primary);
  font-weight: 600;
}

.company-item__count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background-color: var(--color-neutral-200);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.company-item--active .company-item__count {
  background-color: var(--color-primary-lighter);
  color: var(--color-primary-dark);
}

/* ── Column 2: Available Users ── */
.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
  font-family: inherit;
  gap: 0.5rem;
}

.user-item:hover {
  background-color: var(--color-bg-secondary);
}

.user-item:hover .user-item__add {
  opacity: 1;
}

.user-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.user-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__email {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__add {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

/* ── Column 3: Selected ── */
.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.selected-item:last-child {
  border-bottom: none;
}

.selected-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.selected-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-item__company {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.selected-item__remove {
  font-size: 0.75rem;
  color: var(--color-text-disabled);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.375rem;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
  flex-shrink: 0;
  font-family: inherit;
  line-height: 1;
}

.selected-item__remove:hover {
  background-color: #fee2e2;
  color: var(--color-error);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .group-form__row {
    grid-template-columns: 1fr;
  }

  .member-selector__panels {
    grid-template-columns: 1fr;
    grid-template-rows: auto 200px 150px;
    height: auto;
  }

  .panel + .panel {
    border-left: none;
    border-top: 1px solid var(--color-border-default);
  }

  .panel--company .panel__body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .company-item {
    width: auto;
    flex-shrink: 0;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
  }
}
</style>
