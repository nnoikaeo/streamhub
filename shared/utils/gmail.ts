/**
 * Invitations go to Gmail accounts only.
 *
 * Looker Studio and Google Sheets are shared with Google accounts, and the
 * One Data team asked (2026-11) that every StreamHub account be a plain
 * `@gmail.com` one. The invite forms show `@gmail.com` as a fixed suffix, and
 * every server path that creates or reactivates an account checks again here,
 * so a request built by hand cannot invite another domain.
 */
export const GMAIL_DOMAIN = 'gmail.com'

/**
 * Turn what an admin typed into a full Gmail address, or `null` when it is
 * not one.
 *
 * Accepts the part before `@` alone (`somchai.j`) or a full address ending in
 * `@gmail.com`, in any case. Anything with another domain, or characters Gmail
 * does not allow in a username, gives `null`.
 */
export function toGmailAddress(input: string | null | undefined): string | null {
  const value = input?.trim().toLowerCase() ?? ''
  if (!value) return null
  const at = value.indexOf('@')
  const local = at === -1 ? value : value.slice(0, at)
  const domain = at === -1 ? GMAIL_DOMAIN : value.slice(at + 1)
  if (domain !== GMAIL_DOMAIN) return null
  // Gmail usernames: letters, digits and dots; `+tag` is accepted by Gmail
  // for delivery, so allow it rather than reject an address that works.
  if (!/^[a-z0-9](?:[a-z0-9.+]*[a-z0-9])?$/.test(local)) return null
  return `${local}@${GMAIL_DOMAIN}`
}

/** True when the address is a well-formed `@gmail.com` address. */
export function isGmailAddress(email: string | null | undefined): boolean {
  const address = toGmailAddress(email)
  return address !== null && address === email?.trim().toLowerCase()
}
