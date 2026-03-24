import { H3Event, getQuery } from 'h3'
import { findById } from './jsonDatabase'

interface CompanyAccessResult {
  allowed: boolean
  user: any | null
  reason: string
}

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
  // 1. ดึง uid จาก query params หรือ body
  const query = getQuery(event)
  const uid = query.uid as string

  if (!uid) {
    return { allowed: false, user: null, reason: 'Missing uid parameter' }
  }

  // 2. ค้นหา user จาก users.json
  const user = await findById('users.json', uid)
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
export function getInheritingAncestors(
  folderId: string,
  folders: any[]
): any[] {
  const ancestors: any[] = []
  let currentId: string | null = folderId

  while (currentId) {
    const folder = folders.find((f: any) => f.id === currentId)
    if (!folder) break

    if (folder.inheritPermissions && folder.access) {
      ancestors.push(folder)
    }

    currentId = folder.parentId || null
  }

  return ancestors
}

/**
 * Check if a single access+restrictions source blocks the user (restrictions check).
 */
function isRestricted(restrictions: any, uid: string): boolean {
  if (!restrictions) return false
  if (restrictions.revoke?.includes(uid)) return true
  const expiryDate = restrictions.expiry?.[uid]
  if (expiryDate && new Date(expiryDate) < new Date()) return true
  return false
}

/**
 * Check if a single access source grants access to the user (Layer 1 + Layer 2).
 */
function matchesAccessRules(access: any, user: any): boolean {
  if (!access) return false
  // Layer 1: Direct access
  if (access.direct?.users?.includes(user.uid)) return true
  if (user.groups?.some((g: string) => access.direct?.groups?.includes(g))) return true
  // Layer 2: Company-scoped
  // Empty company array means "all companies" — everyone has access
  if (Array.isArray(access.company)) {
    if (access.company.length === 0) return true
    if (access.company.includes(user.company)) return true
  }
  return false
}

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง dashboard ตาม 3-layer model + folder inheritance
 *
 * OR-merge formula:
 *   Final = (DashboardPerms OR FolderPerms) AND NOT (DashboardRestrictions OR FolderRestrictions)
 */
export function checkDashboardAccess(
  dashboard: any,
  user: any,
  folders?: any[]
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
export function filterAccessibleDashboards(
  dashboards: any[],
  user: any,
  folders?: any[]
): any[] {
  if (user.role === 'admin') return dashboards
  return dashboards.filter(d => checkDashboardAccess(d, user, folders).allowed)
}
