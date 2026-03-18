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
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง dashboard ตาม 3-layer model
 * ใช้กับ API endpoint ที่ดึง dashboard เฉพาะ
 */
export function checkDashboardAccess(
  dashboard: any,
  user: any
): { allowed: boolean; reason: string } {
  // Admin bypass
  if (user.role === 'admin') {
    return { allowed: true, reason: 'Admin access' }
  }

  const access = dashboard.access || { direct: { users: [], groups: [] }, company: [] }
  const restrictions = dashboard.restrictions || { revoke: [], expiry: {} }

  // Layer 3: Check restrictions first (deny overrides)
  if (restrictions.revoke?.includes(user.uid)) {
    return { allowed: false, reason: 'Access revoked' }
  }

  const expiryDate = restrictions.expiry?.[user.uid]
  if (expiryDate && new Date(expiryDate) < new Date()) {
    return { allowed: false, reason: 'Access expired' }
  }

  // Layer 1: Direct access (OR condition)
  if (access.direct?.users?.includes(user.uid)) {
    return { allowed: true, reason: 'Direct user access' }
  }
  if (user.groups?.some((g: string) => access.direct?.groups?.includes(g))) {
    return { allowed: true, reason: 'Direct group access' }
  }

  // Layer 2: Company-scoped — any user from a listed company gets access
  if (Array.isArray(access.company) && access.company.includes(user.company)) {
    return { allowed: true, reason: 'Company access' }
  }

  return { allowed: false, reason: 'No matching access rule' }
}

/**
 * Filter dashboards ที่ user มีสิทธิ์เข้าถึง
 */
export function filterAccessibleDashboards(
  dashboards: any[],
  user: any
): any[] {
  if (user.role === 'admin') return dashboards
  return dashboards.filter(d => checkDashboardAccess(d, user).allowed)
}
