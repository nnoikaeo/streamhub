import { getAdminDb, fsQuery } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import { sendInvitationEmail } from '../../utils/emailService'
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

    const { emails, role, company, message, assignedFolders, assignedGroups, invitedBy, invitedByName } = body

    if (!emails?.length || !role || !company) {
      throw createError({
        statusCode: 400,
        message: 'emails, role, and company are required'
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
    const allUsers = allUsersSnap.docs.map(d => ({ ...d.data(), id: d.id }) as UserRecord)

    const created: Invitation[] = []
    const skipped: { email: string; reason: string }[] = []

    for (const email of emails) {
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
        role,
        company,
        status: 'pending',
        invitedBy: invitedBy || 'system',
        invitedByName: invitedByName || 'System',
        message: message || '',
        assignedFolders: assignedFolders || [],
        assignedGroups: assignedGroups || [],
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
