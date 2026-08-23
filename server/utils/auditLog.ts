import { readJSON, writeJSON } from './jsonDatabase'
import type { AuditEntry, AuditLevel } from '#shared/types/audit'

// ============================================================================
// TYPES
// ============================================================================

// Definitions live in shared/types/audit.ts so `/admin/audit` reads the same
// shape this file writes. They are deliberately NOT re-exported from here:
// Nuxt scans both `shared/types` and `server/utils` for auto-imports, so a
// re-export registers each name twice and every dev-server start printed
// "Duplicated imports \"AuditAction\" ... has been ignored". Route handlers
// import the types from '#shared/types/audit' directly.

/** Legacy entry format (invitation events from previous phases) */
interface LegacyAuditEntry {
  action: string
  performedBy: string
  performedByEmail: string
  target: string
  metadata?: Record<string, unknown>
  timestamp: string
}

// ============================================================================
// COOLDOWN (in-memory, resets on server restart)
// ============================================================================

const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
const cooldownMap = new Map<string, number>() // key → last timestamp

function getCooldownKey(userId: string, dashboardId: string, action: string): string {
  return `${userId}:${dashboardId}:${action}`
}

function shouldSkipByCooldown(userId: string, dashboardId: string, action: string): boolean {
  const key = getCooldownKey(userId, dashboardId, action)
  const now = Date.now()
  const lastTime = cooldownMap.get(key)

  if (lastTime && now - lastTime < COOLDOWN_MS) {
    return true // within cooldown window
  }

  cooldownMap.set(key, now)
  return false
}

// Cleanup stale cooldown entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of cooldownMap.entries()) {
    if (now - ts > COOLDOWN_MS * 2) {
      cooldownMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

// ============================================================================
// LOG LEVEL RESOLUTION
// ============================================================================

function getLogLevel(action: AuditAction): AuditLevel {
  switch (action) {
    case 'denied':
      return 'CRITICAL'
    case 'edit':
    case 'archive':
    case 'create':
    case 'delete':
      return 'IMPORTANT'
    case 'view':
    default:
      return 'NORMAL'
  }
}

function shouldApplyCooldown(level: AuditLevel): boolean {
  return level === 'NORMAL' // Only view events get cooldown
}

// ============================================================================
// MONTHLY FILE ROTATION
// ============================================================================

function getMonthlyFilename(date: Date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `audit-log-${yyyy}-${mm}.json`
}

/**
 * List all audit log files sorted newest first
 */
export async function listAuditLogFiles(): Promise<string[]> {
  try {
    const { promises: fs } = await import('fs')
    const { resolve } = await import('path')
    const dataDir = resolve(process.cwd(), '.data')
    const files = await fs.readdir(dataDir)
    return files
      .filter(f => f.startsWith('audit-log-') && f.endsWith('.json'))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

// ============================================================================
// READ SOURCE (Firestore in prod, monthly JSON files in dev/mock)
// ============================================================================

/**
 * Normalize a raw `audit-log` document into the AuditEntry shape the UI expects.
 * Handles two historical formats stored in the same collection:
 *  - New format (logAuditEvent): userName/userEmail/dashboardName/action(lowercase)
 *  - Legacy invitation format (logActivity): performedBy/performedByEmail/target
 */
/** First string among the candidates, mirroring the `??` chain this replaced. */
function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value
  }
  return ''
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined
}

function normalizeAuditDoc(id: string, data: Record<string, unknown>): AuditEntry {
  // Legacy invitation docs store the actor's uid in `performedBy` and a
  // human label (name, sometimes an email) in `performedByEmail`; there is
  // no separate actor-email field. Map the label to userName and leave
  // userEmail blank rather than surfacing the raw uid.
  const metadata = asRecord(data.metadata)
  const level = data.level
  return {
    id,
    action: firstString(data.action),
    // Anything outside the union is stored data we cannot honour, so it reads
    // as NORMAL rather than being passed through as a lie.
    level: level === 'CRITICAL' || level === 'IMPORTANT' ? level : ('NORMAL' satisfies AuditLevel),
    userId: firstString(data.userId, data.performedBy),
    userName: firstString(data.userName, data.performedByEmail),
    userEmail: firstString(data.userEmail),
    company: firstString(data.company, metadata?.company),
    dashboardId: firstString(data.dashboardId),
    dashboardName: firstString(data.dashboardName, data.target),
    metadata,
    userAgent: typeof data.userAgent === 'string' ? data.userAgent : undefined,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date(0).toISOString(),
  }
}

/**
 * Read every audit entry from the active data source.
 * Firestore mode reads the `audit-log` collection (matches the write path);
 * JSON mode merges monthly rotation files.
 */
async function readAllAuditEntries(): Promise<AuditEntry[]> {
  if (process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true') {
    try {
      const { getAdminDb } = await import('./firestoreAdmin')
      const db = getAdminDb()
      if (!db) return []
      const snap = await db.collection('audit-log').get()
      return snap.docs.map(d => normalizeAuditDoc(d.id, d.data()))
    } catch (err) {
      console.error('[AuditLog] Firestore read failed:', err)
      return []
    }
  }

  // JSON mode (dev / mock) — merge monthly files
  const allFiles = await listAuditLogFiles()
  let allLogs: AuditEntry[] = []
  for (const file of allFiles) {
    try {
      const logs = await readJSON<AuditEntry>(file)
      allLogs = allLogs.concat(logs)
    } catch {
      // Skip corrupted files
    }
  }
  return allLogs
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Log an audit event with cooldown and monthly rotation.
 * Returns true if logged, false if skipped by cooldown.
 * In Firestore mode: throws on failure (no JSON fallback).
 */
export async function logAuditEvent(params: {
  action: AuditAction
  userId: string
  userName: string
  userEmail: string
  company: string
  dashboardId: string
  dashboardName: string
  metadata?: Record<string, unknown>
  userAgent?: string
}): Promise<boolean> {
  const level = getLogLevel(params.action)

  // Apply cooldown only to NORMAL level (view events)
  if (shouldApplyCooldown(level)) {
    if (shouldSkipByCooldown(params.userId, params.dashboardId, params.action)) {
      console.log(`[AuditLog] Cooldown skip: ${params.action} by ${params.userName} → ${params.dashboardName}`)
      return false
    }
  }

  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: params.action,
    level,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    company: params.company,
    dashboardId: params.dashboardId,
    dashboardName: params.dashboardName,
    metadata: params.metadata,
    userAgent: params.userAgent,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true') {
    const writeToFirestore = async () => {
      const { getAdminDb } = await import('./firestoreAdmin')
      const db = getAdminDb()
      if (!db) throw new Error('Firestore Admin SDK not available')
      // Firestore Admin SDK rejects `undefined` field values (e.g. optional
      // metadata on view events) — strip them before writing.
      const sanitized = Object.fromEntries(
        Object.entries(entry).filter(([, v]) => v !== undefined)
      )
      await db.collection('audit-log').doc(entry.id).set(sanitized)
    }

    try {
      await writeToFirestore()
    } catch {
      // Retry once before giving up
      try {
        await writeToFirestore()
      } catch (retryError) {
        console.error('[AuditLog] Failed to write to Firestore after retry:', retryError)
        throw retryError
      }
    }

    console.log(`[AuditLog] ${level} ${params.action} by ${params.userName} → ${params.dashboardName} (Firestore)`)
    return true
  }

  // JSON mode (dev / mock only)
  try {
    const filename = getMonthlyFilename()
    let logs: AuditEntry[] = []
    try {
      logs = await readJSON<AuditEntry>(filename)
    } catch {
      // File doesn't exist yet, start fresh
      logs = []
    }
    logs.push(entry)
    await writeJSON(filename, logs)
    console.log(`[AuditLog] ${level} ${params.action} by ${params.userName} → ${params.dashboardName}`)
    return true
  } catch (error) {
    console.error('[AuditLog] Failed to write audit log:', error)
    return false
  }
}

/**
 * Read audit logs with filtering and pagination.
 * Merges multiple monthly files when dateRange spans months.
 */
export async function queryAuditLogs(filters: {
  action?: AuditAction
  userId?: string
  company?: string
  dashboardId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{
  items: AuditEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const page = filters.page || 1
  const limit = filters.limit || 25

  const allLogs = await readAllAuditEntries()

  // Sort newest first
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Apply filters
  let filtered = allLogs

  if (filters.action) {
    filtered = filtered.filter(e => e.action === filters.action)
  }

  if (filters.userId) {
    filtered = filtered.filter(e => e.userId === filters.userId)
  }

  if (filters.company) {
    filtered = filtered.filter(e => e.company === filters.company)
  }

  if (filters.dashboardId) {
    filtered = filtered.filter(e => e.dashboardId === filters.dashboardId)
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= from)
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000 // Include full day
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() <= to)
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(e =>
      e.userName.toLowerCase().includes(q) ||
      e.userEmail.toLowerCase().includes(q) ||
      e.dashboardName.toLowerCase().includes(q)
    )
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / limit) || 1
  const offset = (page - 1) * limit
  const items = filtered.slice(offset, offset + limit)

  return { items, total, page, limit, totalPages }
}

/**
 * Get summary statistics for audit logs
 */
export async function getAuditSummary(): Promise<{
  today: number
  thisWeek: number
  thisMonth: number
  uniqueUsers: number
}> {
  const allLogs = await readAllAuditEntries()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - (now.getDay() * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const today = allLogs.filter(e => new Date(e.timestamp).getTime() >= todayStart).length
  const thisWeek = allLogs.filter(e => new Date(e.timestamp).getTime() >= weekStart).length
  const thisMonth = allLogs.filter(e => new Date(e.timestamp).getTime() >= monthStart).length

  const uniqueUserIds = new Set(allLogs.map(e => e.userId))

  return {
    today,
    thisWeek,
    thisMonth,
    uniqueUsers: uniqueUserIds.size,
  }
}

// ============================================================================
// LEGACY COMPAT — keep old logActivity for invitation events
// ============================================================================

export async function logActivity(entry: Omit<LegacyAuditEntry, 'timestamp'>): Promise<void> {
  const newEntry: LegacyAuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true') {
    const id = `activity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const writeToFirestore = async () => {
      const { getAdminDb } = await import('./firestoreAdmin')
      const db = getAdminDb()
      if (!db) throw new Error('Firestore Admin SDK not available')
      // Firestore Admin SDK rejects `undefined` field values (e.g. optional
      // metadata) — strip them before writing.
      const sanitized = Object.fromEntries(
        Object.entries(newEntry).filter(([, v]) => v !== undefined)
      )
      await db.collection('audit-log').doc(id).set(sanitized)
    }

    try {
      await writeToFirestore()
    } catch {
      // Retry once before giving up
      try {
        await writeToFirestore()
      } catch (retryError) {
        console.error('[AuditLog] Failed to write to Firestore after retry:', retryError)
        throw retryError
      }
    }

    console.log(`[AuditLog] ${entry.action} by ${entry.performedByEmail} → ${entry.target} (Firestore)`)
    return
  }

  // JSON fallback (dev mode / mock mode only)
  try {
    const logs = await readJSON<LegacyAuditEntry>('audit-log.json')
    logs.push(newEntry)
    await writeJSON('audit-log.json', logs)
    console.log(`[AuditLog] ${entry.action} by ${entry.performedByEmail} → ${entry.target}`)
  } catch (error) {
    console.error('[AuditLog] Failed to write audit log:', error)
  }
}
