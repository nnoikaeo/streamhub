import { readJSON, createItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import { sendInvitationEmail } from '../../../utils/emailService'
import { normalizeBulkItems } from '../../../utils/bulkInvite'
import type { Invitation } from '~/types/invitation'

interface UserRecord {
  uid: string
  email: string
  isActive: boolean
  [key: string]: any
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/invitations/bulk')

    const { items, emails, role, company, message, assignedFolders, assignedGroups, invitedBy, invitedByName } = body

    // Normalize to a per-item list (items[] preferred; flat emails[] fallback).
    const normalized = normalizeBulkItems({ items, emails, role, company, message, assignedFolders, assignedGroups })

    if (!normalized.length) {
      throw createError({
        statusCode: 400,
        message: 'at least one invitation (email + role + company) is required'
      })
    }
    if (normalized.some(it => !it.role || !it.company)) {
      throw createError({
        statusCode: 400,
        message: 'each invitation requires email, role, and company'
      })
    }

    const invitations = await readJSON<Invitation>('invitations.json')
    const users = await readJSON<UserRecord>('users.json')

    const created: Invitation[] = []
    const skipped: { email: string; reason: string }[] = []
    const seen = new Set<string>()

    for (const it of normalized) {
      const email = it.email
      if (seen.has(email)) {
        skipped.push({ email, reason: 'Duplicate email in batch' })
        continue
      }
      seen.add(email)

      // Check if active user exists
      const activeUser = users.find(u => u.email === email && u.isActive)
      if (activeUser) {
        skipped.push({ email, reason: 'User already active' })
        continue
      }

      // Check if inactive user exists
      const inactiveUser = users.find(u => u.email === email && !u.isActive)
      if (inactiveUser) {
        skipped.push({ email, reason: 'User exists but inactive — use reactivate' })
        continue
      }

      // Check for existing pending invitation
      const pendingInv = invitations.find(
        inv => inv.email === email && inv.status === 'pending'
      )
      if (pendingInv) {
        skipped.push({ email, reason: 'Pending invitation already exists' })
        continue
      }

      const now = new Date()
      const invitation: Invitation = {
        id: `inv_${Date.now()}_${created.length}`,
        email,
        role: it.role as Invitation['role'],
        company: it.company,
        status: 'pending',
        invitedBy: invitedBy || 'system',
        invitedByName: invitedByName || 'System',
        message: it.message,
        assignedFolders: it.assignedFolders,
        assignedGroups: it.assignedGroups,
        invitationCode: crypto.randomUUID(),
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      const created_item = await createItem('invitations.json', invitation)
      created.push(created_item as Invitation)
    }

    // Send emails for each created invitation (best-effort, in parallel)
    let emailsSent = 0
    let emailsFailed = 0
    if (created.length > 0) {
      const emailResults = await Promise.allSettled(
        created.map(inv =>
          sendInvitationEmail({
            to: inv.email,
            inviterName: inv.invitedByName,
            role: inv.role,
            company: inv.company,
            invitationCode: inv.invitationCode,
            message: inv.message,
            expiresAt: inv.expiresAt
          })
        )
      )
      for (const result of emailResults) {
        if (result.status === 'fulfilled' && result.value) emailsSent++
        else emailsFailed++
      }
    }

    // Audit log
    if (created.length > 0) {
      await logActivity({
        action: 'BULK_INVITE',
        performedBy: invitedBy || 'system',
        performedByEmail: invitedByName || 'System',
        target: `${created.length} emails`,
        metadata: {
          count: created.length,
          emails: created.map(inv => inv.email),
          skippedCount: skipped.length,
          emailsSent,
          emailsFailed
        }
      })
    }

    return {
      success: true,
      data: {
        created,
        skipped,
        emailsSent,
        emailsFailed
      }
    }
  } catch (error: any) {
    console.error('[API] Error bulk creating invitations:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to bulk create invitations'
    })
  }
})
