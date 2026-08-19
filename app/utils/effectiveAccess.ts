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

/**
 * One reason a user has access.
 *
 * Kept structured rather than pre-formatted because the two readers want
 * different detail: the picker badge names only the nearest source
 * ("โฟลเดอร์ Finance"), while the effective-access bar spells out the chain
 * ("📁 Finance · บริษัท STTH").
 */
export interface AccessSource {
  kind: 'direct' | 'group' | 'company' | 'allCompanies' | 'public'
  /** Group name or company code, where the kind carries one. */
  name?: string
  /** Ancestor folder this grant came from — absent when granted on the item. */
  viaFolder?: string
}

export interface AccessEntry {
  uid: string
  name: string
  company?: string
  /** Why they have access, grants on the item itself first. */
  sources: AccessSource[]
  /** Set when a Layer 3 restriction cancels the access above. */
  blockedBy?: string
}

export const ALL_COMPANIES = 'ALL'

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

  const add = (uid: string, source: AccessSource) => {
    const user = users.find((u) => u.uid === uid)
    if (!user) return
    const entry = byUid.get(uid) ?? { uid, name: user.name, company: user.company, sources: [] }
    const already = entry.sources.some(
      (s) => s.kind === source.kind && s.name === source.name && s.viaFolder === source.viaFolder,
    )
    if (!already) entry.sources.push(source)
    byUid.set(uid, entry)
  }

  const usersInCompany = (code: string) =>
    code === ALL_COMPANIES
      ? users.filter((u) => u.company && activeCompanyCodes.includes(u.company))
      : users.filter((u) => u.company === code)

  const applyAccess = (access: PermissionSnapshot['access'], viaFolder?: string) => {
    if (access.public) {
      for (const user of users) add(user.uid, { kind: 'public', viaFolder })
    }

    for (const uid of access.direct.users) add(uid, { kind: 'direct', viaFolder })

    for (const gid of access.direct.groups) {
      const group = groups.find((g) => g.id === gid)
      if (!group) continue
      for (const uid of group.members) add(uid, { kind: 'group', name: group.name, viaFolder })
    }

    for (const code of access.company) {
      const kind = code === ALL_COMPANIES ? 'allCompanies' : 'company'
      for (const user of usersInCompany(code)) {
        add(user.uid, { kind, name: code === ALL_COMPANIES ? undefined : code, viaFolder })
      }
    }
  }

  applyAccess(permissions.access)

  for (const folder of inherited) {
    if (folder.access) applyAccess(folder.access, folder.name)
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

/**
 * Short label for the picker badge — names the nearest source only.
 *
 * An inherited grant reads "โฟลเดอร์ Finance" whatever mechanism the folder
 * used, because the row already shows the user's own company and the folder
 * name is what the admin needs to recognise. The words "โฟลเดอร์" and "กลุ่ม"
 * are spelled out: a folder and a group can carry the same name, and an icon
 * is not enough to tell them apart at a glance.
 */
export function sourceLabel(source: AccessSource): string {
  if (source.viaFolder) return `โฟลเดอร์ ${source.viaFolder}`

  switch (source.kind) {
    case 'direct': return 'สิทธิ์ตรง'
    case 'group': return `กลุ่ม ${source.name}`
    case 'company': return `บริษัท ${source.name}`
    case 'allCompanies': return 'ทุกบริษัท'
    case 'public': return 'สาธารณะ'
  }
}

/** Full chain for the effective-access list, where the detail is wanted. */
export function sourceDetail(source: AccessSource): string {
  const base = source.kind === 'direct' ? 'สิทธิ์ตรง'
    : source.kind === 'group' ? `กลุ่ม ${source.name}`
    : source.kind === 'company' ? `บริษัท ${source.name}`
    : source.kind === 'allCompanies' ? 'ทุกบริษัท'
    : 'สาธารณะ'

  return source.viaFolder ? `📁 ${source.viaFolder} · ${base}` : base
}
