/**
 * "Would this user still reach the dashboard?" [BUG-020]
 *
 * `restrictions.expiry` / `restrictions.revoke` are Layer 3: they apply on top
 * of every path into a dashboard, so removing one grant does not make a
 * restriction meaningless — a user who still arrives through a company or group
 * grant is still bound by it. Clearing it then would silently hand back access
 * an admin had deliberately limited.
 *
 * The permission editor uses this to spot the opposite case: a restriction on
 * someone who, after the grant being removed, has no way in at all. That entry
 * can do nothing except reappear the next time someone grants them access, so
 * the editor offers to clear it.
 */

/** Sentinel used by the editor's company picker for "every company". */
export const ALL_COMPANIES = 'ALL'

/** The grant state as the editor holds it, before any save. */
export interface GrantState {
  public?: boolean
  users: string[]
  groups: string[]
  companies: string[]
}

/** Whether `uid` has access under `state`. */
export function hasAccess(
  uid: string,
  state: GrantState,
  userCompany: string | undefined,
  groupMembers: Record<string, string[]>,
): boolean {
  if (state.public) return true
  if (state.users.includes(uid)) return true
  if (state.companies.includes(ALL_COMPANIES)) return true
  if (userCompany && state.companies.includes(userCompany)) return true

  return state.groups.some((gid) => groupMembers[gid]?.includes(uid) ?? false)
}

/**
 * Which of `restrictedUids` would be left with a restriction and no access.
 *
 * @param restrictedUids users carrying a revoke or expiry entry
 * @param state the grant state as it WOULD be after the removal
 * @param companyOf company code per uid, where known
 * @param groupMembers members of each group, keyed by group id
 */
export function restrictedWithoutAccess(
  restrictedUids: string[],
  state: GrantState,
  companyOf: Record<string, string | undefined>,
  groupMembers: Record<string, string[]>,
): string[] {
  return restrictedUids.filter((uid) => !hasAccess(uid, state, companyOf[uid], groupMembers))
}
