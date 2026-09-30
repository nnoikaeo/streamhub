/**
 * Group labels for the permission editor.
 *
 * Testers could not tell from the editor who belongs to which group, so a
 * group grant was a guess: the user list showed "User · OAYT" and a granted
 * group showed only a head count.
 *
 * Membership is read from `users.groups[]`, never `groups.members[]`. The two
 * are meant to mirror each other but do not always (BUG-005: the `admin` group
 * lists no members while three users name it), and the server decides access
 * from the user's side (`server/utils/companyAccess.ts`). Reading the same
 * side keeps what the editor shows equal to what the server enforces.
 */

interface GroupRef {
  id: string
  name: string
}

interface MemberRef {
  uid: string
  name: string
  groups?: string[]
}

export interface GroupChip {
  id: string
  name: string
  /** This group is already granted here — the user has access through it. */
  granted: boolean
}

/**
 * The groups to show under a user, granted ones first so the green chip is
 * never the one folded into "+N". Ids with no matching group (orphans) are
 * dropped rather than shown raw.
 */
export function userGroupChips(
  groupIds: readonly string[] | undefined,
  groups: readonly GroupRef[],
  grantedIds: readonly string[],
  limit = 2,
): { shown: GroupChip[], hidden: GroupChip[] } {
  const chips = (groupIds ?? [])
    .map((id) => groups.find((g) => g.id === id))
    .filter((g): g is GroupRef => !!g)
    .map((g) => ({ id: g.id, name: g.name, granted: grantedIds.includes(g.id) }))
    .sort((a, b) => Number(b.granted) - Number(a.granted))
  return { shown: chips.slice(0, limit), hidden: chips.slice(limit) }
}

/** Everyone whose own `groups[]` names this group. */
export function groupMembers<T extends MemberRef>(gid: string, users: readonly T[]): T[] {
  return users.filter((u) => (u.groups ?? []).includes(gid))
}

/** "ก ข, Nopphol +2" — the first few member names and how many are left. */
export function memberPreview(
  members: readonly MemberRef[],
  limit = 3,
): { names: string[], extra: number } {
  return {
    names: members.slice(0, limit).map((m) => m.name),
    extra: Math.max(0, members.length - limit),
  }
}
