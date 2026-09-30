/**
 * "แชร์ให้ฉัน" on the home page: how many dashboards someone else owns that
 * this user can open, and through what.
 *
 * The card used to count only dashboards naming the user in
 * `access.direct.users`, so a dashboard reached through a group or the user's
 * company was missing — "ก ข" saw 3 while Discover and the profile said 4.
 * It now counts the same access-checked list Discover shows, and splits it by
 * the first grant that applies, in the order direct → group → company, so the
 * parts always add up to the total. Anything else (public, a folder above the
 * dashboard) is "other".
 */

interface SharedDashboard {
  owner?: string
  access?: {
    direct?: { users?: string[], groups?: string[] }
    company?: string[]
  }
}

interface Viewer {
  uid: string
  groups?: string[]
  company?: string
}

export interface SharedBreakdown {
  total: number
  direct: number
  group: number
  company: number
  other: number
}

export function sharedBreakdown(dashboards: readonly SharedDashboard[], viewer: Viewer): SharedBreakdown {
  const result: SharedBreakdown = { total: 0, direct: 0, group: 0, company: 0, other: 0 }
  const groups = viewer.groups ?? []

  for (const d of dashboards) {
    if (d.owner === viewer.uid) continue
    result.total++
    const a = d.access
    if (a?.direct?.users?.includes(viewer.uid)) result.direct++
    else if (a?.direct?.groups?.some((g) => groups.includes(g))) result.group++
    else if (a?.company?.some((c) => c === 'ALL' || c === viewer.company)) result.company++
    else result.other++
  }
  return result
}

/** "สิทธิ์ตรง 3 · ผ่านกลุ่ม 1" — parts that are zero are left out. */
export function sharedBreakdownLabel(b: SharedBreakdown): string {
  return [
    b.direct && `สิทธิ์ตรง ${b.direct}`,
    b.group && `ผ่านกลุ่ม ${b.group}`,
    b.company && `ผ่านบริษัท ${b.company}`,
    b.other && `อื่น ๆ ${b.other}`,
  ].filter(Boolean).join(' · ')
}
