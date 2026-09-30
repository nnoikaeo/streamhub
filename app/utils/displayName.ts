/**
 * The name the app shows for the signed-in user.
 *
 * Firebase Auth carries the Google account's name, which the user owns and we
 * cannot change. The name an admin sets on /admin/users lives on the Firestore
 * profile (`users.name`). The two only agree until an admin edits the profile —
 * after that the header kept showing the Google name, so the header and the
 * users table named the same account differently.
 *
 * The profile name wins; the Google name is the fallback for a profile that
 * has none (the invite flow, before the profile exists).
 */
export function resolveDisplayName(
  profileName: string | null | undefined,
  authName: string | null,
): string | null {
  const name = profileName?.trim()
  return name ? name : authName
}
