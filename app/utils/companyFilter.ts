/**
 * Which dashboards a company code reaches, for the Discover company filter.
 *
 * `access.company` is a LIST of company codes, not a map. Reading it with `in`
 * checks array indices, so `'STTH' in ['STTH']` is false and the filter
 * returned nothing for every company. The same mistake was fixed server-side
 * in `server/api/mock/dashboards.get.ts` (PR #359) and survived on the client,
 * where only admins see the control and nobody reported it.
 *
 * `ALL` is a real wildcard meaning every active company — `effectiveAccess.ts`
 * expands it that way when it works out who can see a dashboard. A filter that
 * ignored it would hide dashboards the company genuinely has access to, which
 * is the same wrong answer the `in` bug gave, just less often.
 */

import type { Dashboard } from '~/types/dashboard'
// Relative, not `~/`: this is a value import, and plain Vitest resolves no
// Nuxt aliases — the type-only imports elsewhere in app/utils get erased and
// never hit the resolver.
import { ALL_COMPANIES } from './effectiveAccess'

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

  return granted.includes(companyCode) || granted.includes(ALL_COMPANIES)
}
