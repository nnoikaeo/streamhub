/**
 * Audit log types, shared by `server/utils/auditLog.ts` and `/admin/audit`.
 *
 * These lived in two places with different definitions — the server declared
 * `action: AuditAction`, the page declared `action: string` — and the looser
 * one was the accurate one. See `AuditEntry.action` below.
 *
 * Auto-imported into both `app/` and `server/`.
 */

/** Actions written by `logAuditEvent`. Also the accepted input set for POST /api/audit/log. */
export type AuditAction = 'view' | 'edit' | 'archive' | 'create' | 'delete' | 'denied'

export type AuditLevel = 'CRITICAL' | 'IMPORTANT' | 'NORMAL'

export interface AuditEntry {
  id: string

  /**
   * Not narrowed to `AuditAction`: the same collection also holds legacy
   * invitation events written by `logActivity` — `RESEND_INVITATION`,
   * `ACCEPT_INVITATION`, `REACTIVATE_USER` and friends — and
   * `normalizeAuditDoc` falls back to `''` for a document with no action at
   * all. Narrowing this would be a claim the stored data does not honour.
   */
  action: string

  level: AuditLevel
  userId: string
  userName: string
  userEmail: string
  company: string
  dashboardId: string
  dashboardName: string
  metadata?: Record<string, unknown>
  userAgent?: string
  timestamp: string
}

/** Aggregate counts returned by `getAuditSummary`. */
export interface AuditSummary {
  today: number
  thisWeek: number
  thisMonth: number
  uniqueUsers: number
}

/** GET /api/audit?summary=true */
export interface AuditSummaryResponse extends AuditSummary {
  success: true
}

/** GET /api/audit — filtered and paginated. */
export interface AuditListResponse {
  success: true
  items: AuditEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}
