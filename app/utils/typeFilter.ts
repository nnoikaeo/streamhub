/**
 * Discover's dashboard-type filter (Looker Studio / Google Sheets), asked for
 * at the 2026-09-30 meeting. It behaves like the tag filter: nothing selected
 * shows every type, selecting narrows. A dashboard has exactly one type, so
 * several selected types are OR-ed — tags are AND-ed, which would give an
 * empty list here.
 */

import type { DashboardType } from '~/types/dashboard'

export const DASHBOARD_TYPES: readonly DashboardType[] = ['looker', 'sheet']

export const DASHBOARD_TYPE_LABELS: Record<DashboardType, string> = {
  looker: 'Looker Studio',
  sheet: 'Google Sheets',
}

/** Reads `route.query.type` (`sheet`, `looker,sheet`); unknown values are dropped. */
export function parseTypeFilter(value: unknown): DashboardType[] {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v !== 'string') return []
  const picked = new Set(v.split(','))
  return DASHBOARD_TYPES.filter((t) => picked.has(t))
}

/** `type` missing means Looker — every dashboard before Sheets shipped. */
export function matchesTypeFilter(dashboard: { type?: DashboardType }, types: readonly DashboardType[]): boolean {
  return types.length === 0 || types.includes(dashboard.type ?? 'looker')
}
