import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { findById } from './jsonDatabase'
import type { AccessControl, AccessRestrictions, User } from '~/types/dashboard'

/**
 * The folder fields the access walk actually reads.
 *
 * A shape rather than `Folder`: handlers hand over raw store records, whose
 * timestamps are ISO strings (JSON) or Firestore `Timestamp`s, not the `Date`
 * that `Folder` declares. `id` is required, so this is not a weak type.
 */
export interface AccessFolder {
  id: string
  name?: string
  parentId?: string | null
  assignedModerators?: string[]
  inheritPermissions?: boolean
  access?: AccessControl
  restrictions?: AccessRestrictions
}

/** The dashboard fields the access check actually reads — same reasoning. */
export interface AccessDashboard {
  folderId: string
  access?: AccessControl
  restrictions?: AccessRestrictions
}

/** The four user fields the permission rules read. `role` keeps its union. */
export type AccessUser = Pick<User, 'uid' | 'role' | 'company' | 'groups'>

/**
 * `allowed: true` guarantees a user — every caller checks `allowed` first and
 * then reads `.user`, so the union saves them a redundant null check.
 */
export type CompanyAccessResult =
  | { allowed: true, user: User, reason: string }
  | { allowed: false, user: User | null, reason: string }

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง resource ของ company ที่ร้องขอหรือไม่
 * - Admin: เข้าถึงได้ทุก company
 * - Moderator/User: เข้าถึงได้เฉพาะ company ของตัวเอง
 *
 * @param event - H3Event
 * @param requestedCompany - company code ที่ร้องขอ (optional — ถ้าไม่ส่งมาจะใช้ company ของ user)
 * @returns CompanyAccessResult
 */
export async function validateCompanyAccess(
  event: H3Event,
  requestedCompany?: string
): Promise<CompanyAccessResult> {
  // 1. ดึง uid จาก auth context (verified token) หรือ query params (fallback)
  const uid = event.context.auth?.uid || (getQuery(event).uid as string)

  if (!uid) {
    return { allowed: false, user: null, reason: 'Missing uid parameter' }
  }

  // 2. ค้นหา user จาก users.json
  const user = await findById<User>('users.json', uid)
  if (!user) {
    return { allowed: false, user: null, reason: 'User not found' }
  }

  if (!user.isActive) {
    return { allowed: false, user, reason: 'User is inactive' }
  }

  // 3. Admin bypass — admin เข้าถึงได้ทุก company
  if (user.role === 'admin') {
    return { allowed: true, user, reason: 'Admin access' }
  }

  // 4. ถ้าระบุ requestedCompany ให้เช็คว่าตรงกับ company ของ user
  if (requestedCompany && requestedCompany !== user.company) {
    return {
      allowed: false,
      user,
      reason: `User belongs to ${user.company}, cannot access ${requestedCompany}`
    }
  }

  return { allowed: true, user, reason: 'Company match' }
}

/**
 * Walk folder chain upward from a given folderId, returning ancestors
 * that have inheritPermissions=true (and have access defined).
 */
export function getInheritingAncestors<T extends AccessFolder>(
  folderId: string | null | undefined,
  folders: T[]
): T[] {
  const ancestors: T[] = []
  let currentId: string | null = folderId || null

  while (currentId) {
    const folder: T | undefined = folders.find(f => f.id === currentId)
    if (!folder) break

    if (folder.inheritPermissions && folder.access) {
      ancestors.push(folder)
    }

    currentId = folder.parentId || null
  }

  return ancestors
}

/**
 * Whether the user is a moderator assigned to the dashboard's folder, or any
 * ancestor of it. Managing moderators can access dashboards they manage even
 * when no explicit grant is set (default-private) — mirrors the Explorer view. [DESIGN-001]
 */
export function managesFolder(uid: string, folderId: string | null | undefined, folders: AccessFolder[]): boolean {
  let currentId: string | null = folderId || null
  while (currentId) {
    const folder: AccessFolder | undefined = folders.find(f => f.id === currentId)
    if (!folder) break
    if (folder.assignedModerators?.includes(uid)) return true
    currentId = folder.parentId || null
  }
  return false
}

/**
 * Check if a single access+restrictions source blocks the user (restrictions check).
 */
function isRestricted(restrictions: AccessRestrictions | undefined, uid: string): boolean {
  if (!restrictions) return false
  // The optional chains stay: raw store records can be missing either field,
  // even though AccessRestrictions declares both as required.
  if (restrictions.revoke?.includes(uid)) return true
  // expiry is declared as Date but stored as an ISO string / Timestamp
  return isExpired(restrictions.expiry?.[uid])
}

/**
 * Check if a single access source grants access to the user (Layer 1 + Layer 2).
 */
function matchesAccessRules(access: AccessControl | undefined, user: AccessUser): boolean {
  if (!access) return false
  // Explicit org-wide public
  if (access.public === true) return true
  // Layer 1: Direct access
  if (access.direct?.users?.includes(user.uid)) return true
  if (user.groups?.some(g => access.direct?.groups?.includes(g))) return true
  // Layer 2: Company-scoped
  if (Array.isArray(access.company) && access.company.includes(user.company)) return true
  // Default: private [DESIGN-001]
  return false
}

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง dashboard ตาม 3-layer model + folder inheritance
 *
 * OR-merge formula:
 *   Final = (DashboardPerms OR FolderPerms) AND NOT (DashboardRestrictions OR FolderRestrictions)
 */
export function checkDashboardAccess(
  dashboard: AccessDashboard,
  user: AccessUser,
  folders?: AccessFolder[]
): { allowed: boolean; reason: string } {
  // Admin bypass (still respect explicit revocation)
  if (user.role === 'admin') {
    const restrictions = dashboard.restrictions || { revoke: [], expiry: {} }
    if (restrictions.revoke?.includes(user.uid)) {
      return { allowed: false, reason: 'Access revoked' }
    }
    return { allowed: true, reason: 'Admin access' }
  }

  // Collect inheriting ancestor folders
  const ancestorFolders = folders
    ? getInheritingAncestors(dashboard.folderId, folders)
    : []

  // Check ALL restrictions first (dashboard + folder) — deny overrides
  const dashRestrictions = dashboard.restrictions || { revoke: [], expiry: {} }
  if (isRestricted(dashRestrictions, user.uid)) {
    return { allowed: false, reason: 'Access revoked or expired' }
  }
  for (const folder of ancestorFolders) {
    if (isRestricted(folder.restrictions, user.uid)) {
      return { allowed: false, reason: `Restricted by folder: ${folder.name || folder.id}` }
    }
  }

  // Moderator managing the dashboard's folder (or an ancestor) → allow [DESIGN-001]
  if (user.role === 'moderator' && folders && managesFolder(user.uid, dashboard.folderId, folders)) {
    return { allowed: true, reason: 'Moderator-managed folder' }
  }

  // OR-merge: Dashboard permissions OR any ancestor folder permissions
  const dashAccess = dashboard.access || { direct: { users: [], groups: [] }, company: [] }
  if (matchesAccessRules(dashAccess, user)) {
    return { allowed: true, reason: 'Dashboard access' }
  }
  for (const folder of ancestorFolders) {
    if (matchesAccessRules(folder.access, user)) {
      return { allowed: true, reason: `Inherited from folder: ${folder.name || folder.id}` }
    }
  }

  return { allowed: false, reason: 'No matching access rule' }
}

/**
 * Filter dashboards ที่ user มีสิทธิ์เข้าถึง (folder-aware)
 */
export function filterAccessibleDashboards<T extends AccessDashboard>(
  dashboards: T[],
  user: AccessUser,
  folders?: AccessFolder[]
): T[] {
  if (user.role === 'admin') return dashboards
  return dashboards.filter(d => checkDashboardAccess(d, user, folders).allowed)
}
