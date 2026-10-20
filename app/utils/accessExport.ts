/**
 * The CSV files a tool admin compares with the One Data PIC sheet.
 *
 * - Users (`/admin/users`): everyone in StreamHub, so the PIC side can see who
 *   has an account.
 * - Dashboard access (🔑 → จัดการสิทธิ์): everyone who can open one dashboard
 *   right now, and why.
 * - Every dashboard (`/admin/users`, beside the users file): the same rows
 *   for all of them in one file, with the dashboard named on each row — the
 *   PIC has 17 tools, and one paste beats seventeen.
 *
 * StreamHub never reads the PIC. These files are the whole link: someone
 * downloads one and pastes it next to the PIC.
 */
import { toCsv } from './csv'
import { userGroupChips } from './groupDisplay'
import { buildAccessEntries, sourceDetail } from './effectiveAccess'
import type { AccessEntry, AccessSource, PermissionSnapshot } from './effectiveAccess'

interface GroupRef {
  id: string
  name: string
}

interface ExportUser {
  uid: string
  name: string
  email: string
  company?: string
  groups?: string[]
  isActive: boolean
  role: string
}

/** A folder on the dashboard's own chain, with the moderators who manage it. */
interface ManagingFolder {
  name: string
  assignedModerators?: string[]
}

/** A folder as stored — enough to walk up from a dashboard and read its grants. */
interface ExportFolder extends ManagingFolder {
  id: string
  parentId?: string | null
  inheritPermissions?: boolean
  access?: PermissionSnapshot['access'] | null
  restrictions?: PermissionSnapshot['restrictions'] | null
}

interface ExportDashboard {
  id: string
  name: string
  folderId: string
  isArchived?: boolean
  access?: Partial<PermissionSnapshot['access']> | null
  restrictions?: Partial<PermissionSnapshot['restrictions']> | null
}

/** Group names, joined — ids with no group left behind are dropped. */
function groupNames(ids: readonly string[] | undefined, groups: readonly GroupRef[]): string {
  return userGroupChips(ids, groups, [], Infinity).shown.map((g) => g.name).join(', ')
}

/**
 * `sourceDetail` without its 📁 — Excel shows the emoji, but a file meant to be
 * read, filtered and pasted elsewhere is easier with the word.
 */
function sourceText(source: AccessSource): string {
  const base = sourceDetail({ ...source, viaFolder: undefined })
  return source.viaFolder ? `โฟลเดอร์ ${source.viaFolder} · ${base}` : base
}

export const USERS_CSV_HEADERS = ['ชื่อ', 'อีเมล', 'บริษัท', 'กลุ่ม', 'สถานะ'] as const

export function usersCsv(users: readonly ExportUser[], groups: readonly GroupRef[]): string {
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.company ?? '',
    groupNames(user.groups, groups),
    user.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
  ])
  return toCsv(USERS_CSV_HEADERS, rows)
}

export const ACCESS_CSV_HEADERS = ['ชื่อ', 'อีเมล', 'บริษัท', 'กลุ่ม', 'ได้สิทธิ์ผ่าน'] as const

export interface DashboardAccessInput {
  /** Saved grants resolved by `buildAccessEntries` — restricted users are left out here. */
  entries: readonly AccessEntry[]
  users: readonly ExportUser[]
  groups: readonly GroupRef[]
  /** The dashboard's folder and every ancestor. */
  folderChain: readonly ManagingFolder[]
}

/**
 * Everyone who can open the dashboard, one row each.
 *
 * Matches the server's check (`checkDashboardAccess`) for non-admins — the
 * test pins the two together:
 * - a disabled account cannot sign in, so it is left out whatever it was granted
 * - a moderator assigned to the dashboard's folder or an ancestor opens it with
 *   no grant at all, so they are listed — the effective-access bar on the page
 *   does not show them, and a tool admin is usually exactly that moderator
 * - admins see every dashboard and are not listed: they would be on every
 *   file and match no PIC row
 */
export function dashboardAccessCsv(input: DashboardAccessInput): string {
  return toCsv(ACCESS_CSV_HEADERS, accessRows(input))
}

function accessRows(input: DashboardAccessInput): string[][] {
  const { entries, users, groups, folderChain } = input
  const byUid = new Map(users.map((u) => [u.uid, u]))
  const reasons = new Map<string, string[]>()
  // The server checks restrictions before the moderator rule, so a revoked or
  // expired moderator stays out too. A restriction with no grant behind it is
  // not seen here, but the page removes those on save (BUG-022).
  const blocked = new Set(entries.filter((e) => e.blockedBy).map((e) => e.uid))

  for (const entry of entries) {
    if (entry.blockedBy) continue
    reasons.set(entry.uid, entry.sources.map(sourceText))
  }

  for (const folder of folderChain) {
    for (const uid of folder.assignedModerators ?? []) {
      if (byUid.get(uid)?.role !== 'moderator' || blocked.has(uid)) continue
      const list = reasons.get(uid) ?? []
      list.push(`ผู้ดูแลโฟลเดอร์ ${folder.name}`)
      reasons.set(uid, list)
    }
  }

  return [...reasons]
    .map(([uid, why]) => ({ user: byUid.get(uid), why }))
    .filter((r): r is { user: ExportUser, why: string[] } =>
      !!r.user && r.user.isActive && r.user.role !== 'admin')
    .sort((a, b) => a.user.name.localeCompare(b.user.name))
    .map(({ user, why }) => [
      user.name,
      user.email,
      user.company ?? '',
      groupNames(user.groups, groups),
      why.join(' / '),
    ])
}

export const ALL_ACCESS_CSV_HEADERS = ['แดชบอร์ด id', 'แดชบอร์ด', ...ACCESS_CSV_HEADERS] as const

export interface AllDashboardsAccessInput {
  dashboards: readonly ExportDashboard[]
  folders: readonly ExportFolder[]
  users: readonly ExportUser[]
  groups: readonly GroupRef[]
  /** Reads Timestamp / ISO string / Date alike — pass `isExpired`. */
  isExpiredFn: (value: unknown, now: Date) => boolean
  now?: Date
}

/** The dashboard's folder first, then each parent — a missing or looping parent ends the walk. */
function folderChainOf(folderId: string, folders: readonly ExportFolder[]): ExportFolder[] {
  const chain: ExportFolder[] = []
  let id: string | null | undefined = folderId
  while (id && !chain.some((f) => f.id === id)) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) break
    chain.push(folder)
    id = folder.parentId
  }
  return chain
}

/**
 * Everyone who can open each dashboard, one row per dashboard and person.
 *
 * Each dashboard's rows are exactly what 📥 on its permissions page writes —
 * built the way that page builds them, from the stored grants. Archived
 * dashboards are left out: nobody browses to them, and the PIC has no row for
 * a retired report.
 */
export function allDashboardsAccessCsv(input: AllDashboardsAccessInput): string {
  const { dashboards, folders, users, groups, isExpiredFn, now } = input
  const nonAdmin = users.filter((u) => u.role !== 'admin')

  const rows = dashboards
    .filter((d) => !d.isArchived)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((dashboard) => {
      const folderChain = folderChainOf(dashboard.folderId, folders)
      const entries = buildAccessEntries({
        // Older dashboards can lack any of these fields — read them as empty
        permissions: {
          access: {
            public: dashboard.access?.public === true,
            direct: {
              users: dashboard.access?.direct?.users ?? [],
              groups: dashboard.access?.direct?.groups ?? [],
            },
            company: dashboard.access?.company ?? [],
          },
          restrictions: {
            revoke: dashboard.restrictions?.revoke ?? [],
            expiry: dashboard.restrictions?.expiry ?? {},
          },
        },
        users: nonAdmin,
        groups: [...groups],
        inherited: folderChain
          .filter((f) => f.inheritPermissions && f.access)
          .map((f) => ({ name: f.name, access: f.access, restrictions: f.restrictions })),
        isExpiredFn,
        now,
      })
      return accessRows({ entries, users, groups, folderChain })
        .map((row) => [dashboard.id, dashboard.name, ...row])
    })

  return toCsv(ALL_ACCESS_CSV_HEADERS, rows)
}
