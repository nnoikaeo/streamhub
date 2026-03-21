<script setup lang="ts">
/**
 * UserForm Component (Refactored)
 * Form for creating and editing users in admin panel
 *
 * Features:
 * - Fields: UID, Email, Display Name, Company, Role
 * - Validation: Required fields, email format
 * - Uses FormField component for consistent styling
 * - Groups and isActive are managed separately (toggle switch / groups page)
 */

import type { User } from '~/types/dashboard'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { createObjectValidator, validators } from '~/utils/formValidators'
import { computed, onMounted } from 'vue'

interface Props {
  user?: User | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<User>]
}>()

// Composables
const { companies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()

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

// Form validation
const validate = createObjectValidator({
  uid: [
    (value) => validators.required(value, 'UID'),
    (value) => validators.minLength(3, 'UID')(value),
  ],
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
  },
  validate,
  onSubmit: async (values) => {
    emit('submit', values)
  },
})

const isEditMode = computed(() => !!props.user)

// Fetch companies + regions on mount
onMounted(async () => {
  await Promise.all([fetchCompanies(), fetchRegions()])
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
    />
  </div>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}
</style>
