/**
 * "Can this user still reach the dashboard some other way?" [BUG-020]
 *
 * `restrictions.expiry` / `restrictions.revoke` are Layer 3: they apply on top
 * of every path a user can gain access by, so removing a direct grant does not
 * make a restriction meaningless — a user reached through a company or group
 * grant is still time-boxed by it. Dropping the restriction in that case would
 * silently hand back access the admin had deliberately limited.
 *
 * The permission editor uses this to decide whether removing a direct grant
 * leaves a restriction that can do nothing except surprise whoever grants the
 * user access again later — only then does it offer to clear it.
 */

/** The grant state as the editor holds it, before any save. */
export interface AccessScope {
  public?: boolean
  company: string[]
  groups: string[]
}

/** Sentinel used by the editor's company picker for "every company". */
export const ALL_COMPANIES = 'ALL'

/**
 * Whether `uid` keeps access after their direct user grant is removed.
 *
 * @param uid the user being removed
 * @param access the grant state minus nothing — direct users are ignored here
 *   on purpose, since that is the grant being taken away
 * @param userCompany company code of that user, when known
 * @param groupMembers members of each granted group, keyed by group id
 */
export function hasAccessBesidesDirectUser(
  uid: string,
  access: AccessScope,
  userCompany: string | undefined,
  groupMembers: Record<string, string[]>,
): boolean {
  if (access.public) return true
  if (access.company.includes(ALL_COMPANIES)) return true
  if (userCompany && access.company.includes(userCompany)) return true

  return access.groups.some((gid) => groupMembers[gid]?.includes(uid) ?? false)
}
