/**
 * Bulk-invite payload normalization.
 *
 * The client (BulkInviteModal) sends a per-row `items[]` array so each invitee
 * can have its own role/company/group. Older callers send flat arrays
 * (`emails[]` + shared `role`/`company`). This normalizes both shapes into one
 * per-item list so the handler applies the correct values to every invitee.
 *
 * Bug history: BUG-004 — handlers previously ignored `items[]` and applied the
 * shared flat `role`/`company`/`assignedGroups` to every email, so a bulk invite
 * with mixed roles silently downgraded everyone to the first row's values.
 */

export interface NormalizedInviteItem {
  email: string
  role: string
  company: string
  message: string
  assignedFolders: string[]
  assignedGroups: string[]
}

interface BulkInviteBody {
  items?: unknown
  emails?: unknown
  role?: string
  company?: string
  message?: string
  assignedFolders?: string[]
  assignedGroups?: string[]
}

const cleanEmail = (email: unknown): string =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

/** Read one row of `items[]` as a record so its fields can be probed. */
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

/** Keep a value only when it is a string — anything else falls back. */
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

/** Keep a value only when it is an array of strings. */
const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every(v => typeof v === 'string') ? value : undefined

export function normalizeBulkItems(body: BulkInviteBody): NormalizedInviteItem[] {
  const { items, emails, role, company, message, assignedFolders, assignedGroups } = body

  // Per-row mode: each item is authoritative. An omitted group/folder/message
  // means "none" — it must NOT inherit the shared flat values (that leak caused
  // BUG-004's second variant: a row with no group picked up row 1's group).
  // role/company fall back to the shared values only as a safety net; the client
  // always sends them per row.
  if (Array.isArray(items) && items.length) {
    return items
      .map((raw: unknown) => {
        const it = asRecord(raw)
        return {
          email: cleanEmail(it.email),
          role: asString(it.role) ?? role ?? '',
          company: asString(it.company) ?? company ?? '',
          message: asString(it.message) ?? '',
          assignedFolders: asStringArray(it.assignedFolders) ?? [],
          assignedGroups: asStringArray(it.assignedGroups) ?? [],
        }
      })
      .filter((it) => it.email)
  }

  // Legacy flat mode: expand emails[] with the shared role/company/group/message.
  if (Array.isArray(emails)) {
    return emails
      .map((email) => ({
        email: cleanEmail(email),
        role: role ?? '',
        company: company ?? '',
        message: message ?? '',
        assignedFolders: assignedFolders ?? [],
        assignedGroups: assignedGroups ?? [],
      }))
      .filter((it) => it.email)
  }

  return []
}
