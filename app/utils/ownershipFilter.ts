/**
 * The two home cards "แดชบอร์ดของฉัน" and "แชร์ให้ฉัน" link to Discover with
 * `?filter=my` / `?filter=shared`. Discover used to ignore the parameter, so
 * "ดูเพิ่มเติม →" landed on the full list. The split is the one
 * `sharedBreakdown` counts by: the viewer owns it, or someone else does.
 */

export type OwnershipFilter = 'my' | 'shared'

export const OWNERSHIP_FILTER_LABELS: Record<OwnershipFilter, string> = {
  my: 'แดชบอร์ดของฉัน',
  shared: 'แชร์ให้ฉัน',
}

/** Reads `route.query.filter`; anything but `my` / `shared` means no filter. */
export function parseOwnershipFilter(value: unknown): OwnershipFilter | null {
  const v = Array.isArray(value) ? value[0] : value
  return v === 'my' || v === 'shared' ? v : null
}

export function matchesOwnershipFilter(
  dashboard: { owner?: string },
  filter: OwnershipFilter,
  uid: string | undefined,
): boolean {
  const mine = !!uid && dashboard.owner === uid
  return filter === 'my' ? mine : !mine
}
