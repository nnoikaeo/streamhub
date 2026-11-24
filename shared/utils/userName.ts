/**
 * A person's name, stored as two fields.
 *
 * `users.name` used to hold one string, filled from the Google account at
 * invite time — which gave rows like "ช่าง STSB" or "Hotline Streamwash" that
 * matched nobody in One Data's PIC sheet, where people are keyed by ชื่อ and
 * นามสกุล. The admin now types both at invite time, and both are optional, so
 * every reader goes through here instead of reading the fields itself.
 */
export interface NamedUser {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

/** `ชื่อ นามสกุล`, or `''` when neither is set. */
export function fullName(user: NamedUser | null | undefined): string {
  if (!user) return ''
  return [user.firstName, user.lastName]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
}

/** What a list shows for a user: the full name, or the email when there is no name. */
export function userLabel(user: NamedUser | null | undefined): string {
  return fullName(user) || user?.email?.trim() || ''
}

/**
 * Split one name string at the first space: the first word is the first name,
 * everything after it the last name.
 *
 * Used where only a single string exists — a Google account's display name at
 * invite acceptance, and the one-off migration of the old `name` field. It is a
 * guess (a Thai name with a title, or a two-word first name, splits wrong), so
 * nothing calls it where an admin typed the two parts.
 */
export function splitName(name: string | null | undefined): { firstName: string, lastName: string } {
  const trimmed = name?.trim().replace(/\s+/g, ' ') ?? ''
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) }
}

/**
 * The name a user starts with when they accept an invitation.
 *
 * The name the admin typed wins. An invitation without one falls back to the
 * Google account's display name, split by `splitName` — a guess the admin can
 * correct on /admin/users.
 */
export function nameAtAcceptance(
  invitation: NamedUser,
  googleDisplayName: string | null | undefined,
): { firstName: string, lastName: string } {
  if (fullName(invitation)) {
    return { firstName: invitation.firstName?.trim() ?? '', lastName: invitation.lastName?.trim() ?? '' }
  }
  return splitName(googleDisplayName)
}

/** Longest name part kept — a PIC name is far shorter; this only stops junk. */
export const NAME_PART_MAX = 100

/**
 * A first or last name as it is stored: trimmed, inner whitespace collapsed,
 * capped at `NAME_PART_MAX`. Anything that is not a string reads as `''`, so a
 * request body can be passed straight in.
 */
export function cleanNamePart(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, NAME_PART_MAX)
}
