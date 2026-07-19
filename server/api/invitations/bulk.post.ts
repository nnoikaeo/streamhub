import { getAdminDb, fsQuery } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import { sendInvitationEmail } from '../../utils/emailService'
import { normalizeBulkItems } from '../../utils/bulkInvite'
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
    console.log('[API] POST /api/invitations/bulk')

    const { items, emails, role, company, message, assignedFolders, assignedGroups, invitedBy, invitedByName } = body

    // Normalize to a per-item list. Prefer items[] (per-row role/company/group);
    // fall back to flat arrays (emails[] + shared role/company) for backward compat.
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

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    // Fetch all existing invitations and users once (avoid N+1 queries)
    const [allInvSnap, allUsersSnap] = await Promise.all([
      db.collection('invitations').get(),
      db.collection('users').get()
    ])

    const allInvitations = allInvSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Invitation)
    const allUsers = allUsersSnap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as UserRecord)

    const created: Invitation[] = []
    const skipped: { email: string; reason: string }[] = []
    const seen = new Set<string>()

    for (const item of normalized) {
      const email = item.email
      if (seen.has(email)) {
        skipped.push({ email, reason: 'Duplicate email in batch' })
        continue
      }
      seen.add(email)

      const activeUser = allUsers.find(u => u.email === email && u.isActive)
      if (activeUser) {
        skipped.push({ email, reason: 'User already active' })
        continue
      }

      const inactiveUser = allUsers.find(u => u.email === email && !u.isActive)
      if (inactiveUser) {
        skipped.push({ email, reason: 'User exists but inactive — use reactivate' })
        continue
      }

      const pendingInv = allInvitations.find(inv => inv.email === email && inv.status === 'pending')
      if (pendingInv) {
        skipped.push({ email, reason: 'Pending invitation already exists' })
        continue
      }

      const now = new Date()
      const id = `inv_${Date.now()}_${created.length}`
      const invitation: Invitation = {
        id,
        email,
        role: item.role as Invitation['role'],
        company: item.company,
        status: 'pending',
        invitedBy: invitedBy || 'system',
        invitedByName: invitedByName || 'System',
        message: item.message,
        assignedFolders: item.assignedFolders,
        assignedGroups: item.assignedGroups,
        invitationCode: crypto.randomUUID(),
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      await db.collection('invitations').doc(id).set(invitation)
      created.push(invitation)
    }

    // Send emails in parallel (best-effort)
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
