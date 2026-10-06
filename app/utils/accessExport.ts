/**
 * The two CSV files a tool admin compares with the One Data PIC sheet.
 *
 * - Users (`/admin/users`): everyone in StreamHub, so the PIC side can see who
 *   has an account.
 * - Dashboard access (🔑 → จัดการสิทธิ์): everyone who can open one dashboard
 *   right now, and why.
 *
 * StreamHub never reads the PIC. These files are the whole link: someone
 * downloads one and pastes it next to the PIC.
 */
import { toCsv } from './csv'
import { userGroupChips } from './groupDisplay'
import { sourceDetail } from './effectiveAccess'
import type { AccessEntry, AccessSource } from './effectiveAccess'

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
  const { entries, users, groups, folderChain } = input
  const byUid = new Map(users.map((u) => [u.uid, u]))
  const reasons = new Map<string, string[]>()
  // The server checks restrictions before the moderator rule, so a revoked or
  // expired moderator stays out too. A restriction with no grant behind it is
  // not seen here, but the page removes those on save (BUG-022).
  const blocked = new Set(entries.filter((e) => e.blockedBy).map((e) => e.uid))

  for (const entry of entries) {
    if (entry.blockedBy) continue
    // "ทุกบริษัท" is stored as company `ALL`, which the server's check never
    // matches (`company.includes(user.company)`) — it grants nobody today. The
    // file lists who can actually open the dashboard, so it is left out here.
    const granted = entry.sources.filter((s) => s.kind !== 'allCompanies')
    if (granted.length > 0) reasons.set(entry.uid, granted.map(sourceText))
  }

  for (const folder of folderChain) {
    for (const uid of folder.assignedModerators ?? []) {
      if (byUid.get(uid)?.role !== 'moderator' || blocked.has(uid)) continue
      const list = reasons.get(uid) ?? []
      list.push(`ผู้ดูแลโฟลเดอร์ ${folder.name}`)
      reasons.set(uid, list)
    }
  }

  const rows = [...reasons]
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

  return toCsv(ACCESS_CSV_HEADERS, rows)
}
