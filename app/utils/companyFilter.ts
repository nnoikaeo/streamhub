/**
 * Which dashboards a company code reaches, for the Discover company filter.
 *
 * `access.company` is a LIST of company codes, not a map. Reading it with `in`
 * checks array indices, so `'STTH' in ['STTH']` is false and the filter
 * returned nothing for every company. The same mistake was fixed server-side
 * in `server/api/mock/dashboards.get.ts` (PR #359) and survived on the client,
 * where only admins see the control and nobody reported it.
 *
 * There is no "every company" value. The editor once offered "ทุกบริษัท",
 * stored as `ALL`, which no access check ever matched (BUG-043); it was
 * removed, and 🌐 public is the one way to share with everyone.
 */

import type { Dashboard } from '~/types/dashboard'

/**
 * Whether `companyCode` is granted access to this dashboard.
 *
 * Only company grants count. A dashboard reachable through a direct user or
 * group grant is not "this company's" — the filter answers a question about
 * company access, and widening it would make the control mean nothing.
 */
export function matchesCompanyFilter(dashboard: Pick<Dashboard, 'access'>, companyCode: string): boolean {
  const granted = dashboard.access?.company
  if (!granted?.length) return false

  return granted.includes(companyCode)
}
