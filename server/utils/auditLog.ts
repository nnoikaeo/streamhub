import { readJSON, writeJSON } from './jsonDatabase'

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction = 'view' | 'edit' | 'archive' | 'create' | 'delete' | 'denied'
export type AuditLevel = 'CRITICAL' | 'IMPORTANT' | 'NORMAL'

export interface AuditEntry {
  id: string
  action: AuditAction
  level: AuditLevel
  userId: string
  userName: string
  userEmail: string
  company: string
  dashboardId: string
  dashboardName: string
  metadata?: Record<string, any>
  userAgent?: string
  timestamp: string
}

/** Legacy entry format (invitation events from previous phases) */
interface LegacyAuditEntry {
  action: string
  performedBy: string
  performedByEmail: string
  target: string
  metadata?: Record<string, any>
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
  metadata?: Record<string, any>
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
      await db.collection('audit-log').doc(entry.id).set(entry)
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

  // Determine which monthly files to read
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

  // Also include legacy audit-log.json (old format) — skip for now as format differs
  // Future: migrate legacy entries

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
  const allFiles = await listAuditLogFiles()
  let allLogs: AuditEntry[] = []

  for (const file of allFiles) {
    try {
      const logs = await readJSON<AuditEntry>(file)
      allLogs = allLogs.concat(logs)
    } catch {
      // skip
    }
  }

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
      await db.collection('audit-log').doc(id).set(newEntry)
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
