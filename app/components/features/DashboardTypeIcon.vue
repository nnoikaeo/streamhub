<script setup lang="ts">
/**
 * The glyph for a dashboard's embed type.
 *
 * One component rather than an inline `<svg>` per list, because the mapping
 * from type to glyph is the thing that must stay the same everywhere: a sheet
 * that looks like a Looker report in one list and not another is worse than
 * both showing the same icon.
 *
 * `variant` exists because the surrounding icons differ. The explorer lists
 * put this next to a solid folder glyph; DashboardCard draws outline icons.
 */

import type { DashboardType } from '~/types/dashboard'

withDefaults(defineProps<{
  type?: DashboardType
  variant?: 'solid' | 'outline'
}>(), {
  type: 'looker',
  variant: 'solid',
})
</script>

<template>
  <!-- Sheet: a table with a header row. Looker: the four-panel report grid. -->
  <svg v-if="variant === 'solid'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      v-if="type === 'sheet'"
      d="M3 5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v3H3V5zm0 5h6v4H3v-4zm8 0h10v4H11v-4zM3 16h6v5H5c-1.1 0-2-.9-2-2v-3zm8 0h10v3c0 1.1-.9 2-2 2h-8v-5z"
    />
    <path
      v-else
      d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
    />
  </svg>

  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <template v-if="type === 'sheet'">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="10" y1="9" x2="10" y2="21" />
    </template>
    <template v-else>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </template>
  </svg>
</template>
