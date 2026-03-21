import { readJSON, writeJSON } from './jsonDatabase'

interface AuditEntry {
  action: string
  performedBy: string
  performedByEmail: string
  target: string
  metadata?: Record<string, any>
  timestamp: string
}

export async function logActivity(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  try {
    const logs = await readJSON<AuditEntry>('audit-log.json')
    const newEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }
    logs.push(newEntry)
    await writeJSON('audit-log.json', logs)
    console.log(`[AuditLog] ${entry.action} by ${entry.performedByEmail} → ${entry.target}`)
  } catch (error) {
    console.error('[AuditLog] Failed to write audit log:', error)
  }
}
