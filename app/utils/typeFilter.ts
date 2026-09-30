/**
 * Discover's dashboard-type filter (Looker Studio / Google Sheets), asked for
 * at the 2026-09-30 meeting. A strip of three — ทั้งหมด | Looker Studio |
 * Google Sheets — rather than tag-style toggles: with two types, "none
 * selected" and "both selected" looked different and showed the same list.
 */

import type { DashboardType } from '~/types/dashboard'

export type TypeFilterValue = DashboardType | 'all'

export const TYPE_FILTER_OPTIONS: { value: TypeFilterValue, label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'looker', label: 'Looker Studio' },
  { value: 'sheet', label: 'Google Sheets' },
]

export const DASHBOARD_TYPE_LABELS: Record<DashboardType, string> = {
  looker: 'Looker Studio',
  sheet: 'Google Sheets',
}

/** Reads `route.query.type`; anything but `looker` / `sheet` means all. */
export function parseTypeFilter(value: unknown): TypeFilterValue {
  const v = Array.isArray(value) ? value[0] : value
  return v === 'looker' || v === 'sheet' ? v : 'all'
}

/** `type` missing means Looker — every dashboard before Sheets shipped. */
export function matchesTypeFilter(dashboard: { type?: DashboardType }, filter: TypeFilterValue): boolean {
  return filter === 'all' || (dashboard.type ?? 'looker') === filter
}
