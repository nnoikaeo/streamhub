<template>
  <div class="company-dropdown-filter">
    <svg class="company-dropdown-filter__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
    <select
      class="theme-form-select"
      :value="modelValue ?? ''"
      @change="handleChange"
    >
      <option value="">ทุกบริษัท</option>

      <!-- Companies without region (e.g. STTH, STTN, STCS) -->
      <option
        v-for="company in ungroupedCompanies"
        :key="company.code"
        :value="company.code"
      >
        {{ company.code }}
      </option>

      <!-- Grouped by region -->
      <optgroup
        v-for="group in regionGroups"
        :key="group.region"
        :label="group.region"
      >
        <option
          v-for="company in group.companies"
          :key="company.code"
          :value="company.code"
        >
          {{ company.code }}{{ company.regionRole === 'hub' ? ' (Hub)' : '' }}
        </option>
      </optgroup>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Company, Region } from '~/types/admin'

const props = withDefaults(defineProps<{
  companies: Company[]
  regions?: Region[]
  modelValue: string | null
}>(), {
  modelValue: null,
  regions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

/** Companies without a region — shown at top level, sorted by sortOrder */
const ungroupedCompanies = computed(() =>
  props.companies
    .filter(c => !c.region && c.isActive)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
)

/** Region code → name map */
const regionNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const r of props.regions) {
    map[r.code] = r.name
  }
  return map
})

/** Region code → sortOrder map */
const regionSortMap = computed(() => {
  const map: Record<string, number> = {}
  for (const r of props.regions) {
    map[r.code] = r.sortOrder ?? 999
  }
  return map
})

/** Companies grouped by region, sorted by region sortOrder, then hub first + company sortOrder */
const regionGroups = computed(() => {
  const grouped = new Map<string, Company[]>()

  for (const company of props.companies) {
    if (!company.region || !company.isActive) continue
    if (!grouped.has(company.region)) {
      grouped.set(company.region, [])
    }
    grouped.get(company.region)!.push(company)
  }

  return Array.from(grouped.entries())
    .sort(([codeA], [codeB]) => {
      return (regionSortMap.value[codeA] ?? 999) - (regionSortMap.value[codeB] ?? 999)
    })
    .map(([regionCode, companies]) => ({
      region: regionNameMap.value[regionCode] ?? regionCode,
      companies: companies.sort((a, b) => {
        // Hub first, then subs
        if (a.regionRole === 'hub' && b.regionRole !== 'hub') return -1
        if (a.regionRole !== 'hub' && b.regionRole === 'hub') return 1
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
      }),
    }))
})

const handleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value || null)
}
</script>

<style scoped>
.company-dropdown-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.company-dropdown-filter__icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .company-dropdown-filter {
    width: 100%;
  }
}
</style>
