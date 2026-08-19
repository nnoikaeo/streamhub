/**
 * Who can reach an item, and why.
 *
 * One builder for both readers on the permissions page: the "ผลลัพธ์รวม" bar at
 * the bottom, and the badges in the user picker. They used to be two different
 * ideas of "has access" — the bar deducted restrictions and nothing else did,
 * which is how a screen could show "จัดการสิทธิ์ 0" next to "ข้อจำกัด 1" and
 * leave the admin to work out which one was true.
 *
 * Access is Layer 1 (direct users / groups) OR Layer 2 (company), inherited
 * from every ancestor folder, then Layer 3 (revoke / expiry) subtracted — the
 * same order `useFirestoreService.checkAccess` and `companyAccess.isRestricted`
 * apply on the read side.
 */

/** Grants and restrictions of one dashboard or folder. */
export interface PermissionSnapshot {
  access: {
    public?: boolean
    direct: { users: string[], groups: string[] }
    company: string[]
  }
  restrictions: {
    revoke: string[]
    expiry: Record<string, unknown>
  }
}

/** An ancestor folder contributing inherited grants. */
export interface InheritedSource {
  name: string
  access?: PermissionSnapshot['access'] | null
  restrictions?: PermissionSnapshot['restrictions'] | null
}

export interface AccessInput {
  permissions: PermissionSnapshot
  /** Users eligible for access — admins are excluded by the caller. */
  users: { uid: string, name: string, company?: string }[]
  groups: { id: string, name: string, members: string[] }[]
  /** Company codes that "ทุกบริษัท" expands to. */
  activeCompanyCodes: string[]
  inherited?: InheritedSource[]
  /** Reads Timestamp / ISO string / Date alike — pass `isExpired`. */
  isExpiredFn: (value: unknown, now: Date) => boolean
  now?: Date
}

export interface AccessEntry {
  uid: string
  name: string
  company?: string
  /** Why they have access, most direct first. */
  sources: string[]
  /** Set when a Layer 3 restriction cancels the access above. */
  blockedBy?: string
}

export const ALL_COMPANIES = 'ALL'
export const DIRECT_SOURCE = 'สิทธิ์ตรง'

/**
 * Everyone the grants reach, each with their reasons and any restriction.
 *
 * Restricted users are kept in the result with `blockedBy` set rather than
 * dropped, so a caller can say "granted but expired" instead of showing
 * nothing — `accessibleUsers` filters them out for the plain count.
 */
export function buildAccessEntries(input: AccessInput): AccessEntry[] {
  const { permissions, users, groups, activeCompanyCodes, inherited = [], isExpiredFn } = input
  const now = input.now ?? new Date()
  const byUid = new Map<string, AccessEntry>()

  const add = (uid: string, source: string) => {
    const user = users.find((u) => u.uid === uid)
    if (!user) return
    const entry = byUid.get(uid) ?? { uid, name: user.name, company: user.company, sources: [] }
    if (!entry.sources.includes(source)) entry.sources.push(source)
    byUid.set(uid, entry)
  }

  const companyLabel = (code: string) => (code === ALL_COMPANIES ? 'ทุกบริษัท' : `บริษัท ${code}`)

  const usersInCompany = (code: string) =>
    code === ALL_COMPANIES
      ? users.filter((u) => u.company && activeCompanyCodes.includes(u.company))
      : users.filter((u) => u.company === code)

  const applyAccess = (access: PermissionSnapshot['access'], prefix = '') => {
    if (access.public) {
      for (const user of users) add(user.uid, `${prefix}สาธารณะ`)
    }

    for (const uid of access.direct.users) add(uid, prefix ? `${prefix}${DIRECT_SOURCE}` : DIRECT_SOURCE)

    for (const gid of access.direct.groups) {
      const group = groups.find((g) => g.id === gid)
      if (!group) continue
      for (const uid of group.members) add(uid, `${prefix}กลุ่ม ${group.name}`)
    }

    for (const code of access.company) {
      for (const user of usersInCompany(code)) add(user.uid, `${prefix}${companyLabel(code)}`)
    }
  }

  applyAccess(permissions.access)

  for (const folder of inherited) {
    if (folder.access) applyAccess(folder.access, `📁 ${folder.name} · `)
  }

  // Layer 3 — the item's own restrictions and every ancestor's
  const blocked = new Map<string, string>()
  const collectRestrictions = (restrictions: PermissionSnapshot['restrictions']) => {
    for (const uid of restrictions.revoke) blocked.set(uid, 'ถูกระงับ')
    for (const [uid, value] of Object.entries(restrictions.expiry ?? {})) {
      if (isExpiredFn(value, now)) blocked.set(uid, 'หมดอายุแล้ว')
    }
  }

  collectRestrictions(permissions.restrictions)
  for (const folder of inherited) {
    if (folder.restrictions) collectRestrictions(folder.restrictions)
  }

  for (const [uid, reason] of blocked) {
    const entry = byUid.get(uid)
    if (entry) entry.blockedBy = reason
  }

  return Array.from(byUid.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/** Entries that actually resolve to access right now. */
export function accessibleUsers(entries: AccessEntry[]): AccessEntry[] {
  return entries.filter((entry) => !entry.blockedBy)
}
