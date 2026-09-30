/**
 * Group membership a role may hold.
 *
 * An admin reaches every dashboard by role, so a group on an admin does
 * nothing but mislead: on prod three admins were invited into an `Admin`
 * group, which then showed up in the permission editor as something to grant
 * (deleted 2026-09-30). Forms hide the group picker for admins and every write
 * path runs through this, so an admin always ends up with no groups — and a
 * user promoted to admin loses theirs on save.
 */
export function groupsForRole(role: string | null | undefined, groups: readonly string[] | null | undefined): string[] {
  if (role === 'admin') return []
  return [...(groups ?? [])]
}
