<script setup lang="ts">
/**
 * UserForm Component
 * Form for editing users in admin panel
 *
 * Features:
 * - Fields: Email (disabled in edit), Name, Company, Role, Groups, Moderator Folders
 * - Email is read-only in edit mode (set by Firebase Auth)
 * - Groups: multi-select from active AdminGroup list
 * - Moderator Folders: shown only when role = moderator
 * - Uses FormField component for consistent styling
 */

import type { User, Folder } from '~/types/dashboard'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { createObjectValidator, validators } from '~/utils/formValidators'
import FolderCheckboxTree from '~/components/admin/forms/FolderCheckboxTree.vue'
import { computed, onMounted, ref } from 'vue'

interface Props {
  user?: User | null
}

export interface UserFormSubmitPayload {
  user: Partial<User>
  selectedFolderIds: string[]
  previousRole: User['role']
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: UserFormSubmitPayload]
}>()

// Composables
const { companies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const { groups, fetchGroups } = useAdminGroups()
const { folders, fetchFolders } = useAdminFolders()

// Company grouping (same logic as CompanyDropdownFilter)
const ungroupedCompanies = computed(() =>
  companies.value
    .filter(c => !c.region && c.isActive)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
)

const regionGroups = computed(() => {
  const regionSortMap: Record<string, number> = {}
  const regionNameMap: Record<string, string> = {}
  for (const r of regions.value) {
    regionSortMap[r.code] = r.sortOrder ?? 999
    regionNameMap[r.code] = r.name
  }

  const grouped = new Map<string, typeof companies.value>()
  for (const c of companies.value) {
    if (!c.region || !c.isActive) continue
    if (!grouped.has(c.region)) grouped.set(c.region, [])
    grouped.get(c.region)!.push(c)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (regionSortMap[a] ?? 999) - (regionSortMap[b] ?? 999))
    .map(([code, comps]) => ({
      region: regionNameMap[code] ?? code,
      companies: comps.sort((a, b) => {
        if (a.regionRole === 'hub' && b.regionRole !== 'hub') return -1
        if (a.regionRole !== 'hub' && b.regionRole === 'hub') return 1
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
      }),
    }))
})

// Role options
const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'User', value: 'user' },
]

// Company groupedOptions for FormField
const companyGroupedOptions = computed(() => {
  const result: Array<{ group?: string; items: Array<{ label: string; value: string }> }> = []

  if (ungroupedCompanies.value.length > 0) {
    result.push({
      items: ungroupedCompanies.value.map(c => ({
        label: `${c.code} - ${c.name}`,
        value: c.code,
      })),
    })
  }

  for (const group of regionGroups.value) {
    result.push({
      group: group.region,
      items: group.companies.map(c => ({
        label: `${c.code}${c.regionRole === 'hub' ? ' (Hub)' : ''} - ${c.name}`,
        value: c.code,
      })),
    })
  }

  return result
})

// Active groups → multi-select options (value = group name, see wireframe)
const groupOptions = computed(() =>
  groups.value
    .filter(g => g.isActive)
    .map(g => ({ label: g.name, value: g.name }))
)

// Active folders only — tree picker filters these further by parentId
const activeFolders = computed<Folder[]>(() =>
  folders.value.filter(f => f.isActive)
)

// Local state for moderator folder picker (not stored in User document)
const selectedFolderIds = ref<string[]>([])
const previousRole = props.user?.role || 'user'

// Form validation
const validate = createObjectValidator({
  email: [
    (value) => validators.required(value, 'อีเมล'),
    (value) => validators.email(value),
  ],
  name: [(value) => validators.required(value, 'ชื่อ')],
})

const { formData, errors, handleSubmit, setFieldTouched } = useForm({
  initialValues: {
    uid: props.user?.uid || '',
    email: props.user?.email || '',
    name: props.user?.name || '',
    company: props.user?.company || 'STTH',
    role: props.user?.role || 'user',
    groups: props.user?.groups || [],
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', {
      user: {
        uid: values.uid,
        name: values.name,
        company: values.company,
        role: values.role,
        groups: values.groups,
      },
      selectedFolderIds: values.role === 'moderator' ? selectedFolderIds.value : [],
      previousRole,
    })
  },
})

const isEditMode = computed(() => !!props.user)
const isModeratorRole = computed(() => formData.role === 'moderator')

// Fetch all reference data on mount, then pre-populate folder selection
onMounted(async () => {
  await Promise.all([fetchCompanies(), fetchRegions(), fetchGroups(), fetchFolders()])
  if (props.user?.uid) {
    selectedFolderIds.value = folders.value
      .filter(f => (f.assignedModerators ?? []).includes(props.user!.uid))
      .map(f => f.id)
  }
})

defineExpose({ submit: handleSubmit })
</script>

<template>
  <div class="user-form">
    <FormField
      v-model="formData.email"
      type="email"
      label="อีเมล"
      placeholder="user@streamwash.com"
      :error="errors.email"
      :required="true"
      :disabled="isEditMode"
      :description="isEditMode ? '🔒 อีเมลไม่สามารถเปลี่ยนได้ เนื่องจากผูกกับ Firebase Auth' : undefined"
      @blur="setFieldTouched('email')"
    />

    <FormField
      v-model="formData.name"
      type="text"
      label="ชื่อจริง"
      placeholder="เช่น John Doe"
      :error="errors.name"
      :required="true"
      @blur="setFieldTouched('name')"
    />

    <FormField
      v-model="formData.company"
      type="grouped-select"
      label="บริษัท"
      :grouped-options="companyGroupedOptions"
    />

    <FormField
      v-model="formData.role"
      type="select"
      label="บทบาท"
      :options="roleOptions"
      :hide-blank-option="true"
    />

    <div v-if="isModeratorRole" class="user-form__folder-section">
      <label class="user-form__folder-label">โฟลเดอร์ที่จัดการได้</label>
      <FolderCheckboxTree
        v-model="selectedFolderIds"
        :folders="activeFolders"
      />
      <p class="user-form__folder-hint">
        เลือกโฟลเดอร์ที่ผู้ใช้คนนี้ดูแลในฐานะ moderator
      </p>
    </div>

    <FormField
      v-model="formData.groups"
      type="multi-select"
      label="กลุ่ม"
      :options="groupOptions"
      description="เลือกกลุ่มที่ผู้ใช้คนนี้สังกัด"
    />
  </div>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

.user-form__folder-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.user-form__folder-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
}

.user-form__folder-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #6b7280);
  font-style: italic;
}
</style>
