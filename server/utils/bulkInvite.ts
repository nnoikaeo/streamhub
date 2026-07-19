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

export function normalizeBulkItems(body: BulkInviteBody): NormalizedInviteItem[] {
  const { items, emails, role, company, message, assignedFolders, assignedGroups } = body

  // Prefer per-row items[]; otherwise expand flat emails[] with shared values.
  const rawItems: any[] = Array.isArray(items) && items.length
    ? items
    : Array.isArray(emails)
      ? emails.map((email) => ({ email }))
      : []

  return rawItems
    .map((it) => ({
      email: typeof it?.email === 'string' ? it.email.trim().toLowerCase() : '',
      role: it?.role ?? role ?? '',
      company: it?.company ?? company ?? '',
      message: it?.message ?? message ?? '',
      assignedFolders: it?.assignedFolders ?? assignedFolders ?? [],
      assignedGroups: it?.assignedGroups ?? assignedGroups ?? [],
    }))
    .filter((it) => it.email)
}
