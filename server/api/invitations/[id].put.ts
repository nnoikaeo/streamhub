import { getAdminDb } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import { sendInvitationEmail } from '../../utils/emailService'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<Partial<Invitation> & { resend?: boolean; performedBy?: string; performedByEmail?: string }>(event)
    console.log('[API] PUT /api/invitations/:id -', id, '| body.status:', body.status)

    if (!id) {
      throw createError({ statusCode: 400, message: 'Invitation ID is required' })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    const docRef = db.collection('invitations').doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw createError({ statusCode: 404, message: `Invitation with ID "${id}" not found` })
    }

    const existing = { ...docSnap.data(), id: docSnap.id } as Invitation
    console.log('[API] Existing invitation:', { id: existing.id, email: existing.email, status: existing.status })

    const { resend: isResendFlag, performedBy, performedByEmail, ...bodyUpdates } = body
    const updates: Record<string, unknown> = { ...bodyUpdates }
    let emailSent = false
    const isResend = isResendFlag === true

    // Handle resend: reset expiry + new invitation code + send email
    if (body.status === 'pending' && (existing.status !== 'pending' || isResend)) {
      // Hoisted out of the untyped `updates` bag: both values are read back
      // below and handed to sendInvitationEmail, which wants strings.
      const invitationCode = crypto.randomUUID()
      const expiresAt = typeof bodyUpdates.expiresAt === 'string' && bodyUpdates.expiresAt
        ? bodyUpdates.expiresAt
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      updates.invitationCode = invitationCode
      updates.expiresAt = expiresAt
      updates.updatedAt = new Date().toISOString()

      console.log('[API] 📨 Resend detected — new invitationCode:', invitationCode)

      emailSent = await sendInvitationEmail({
        to: existing.email,
        inviterName: existing.invitedByName,
        role: existing.role,
        company: existing.company,
        invitationCode,
        message: existing.message,
        expiresAt
      })

      console.log('[API] 📨 Email result:', emailSent ? '✅ Sent' : '❌ Failed/Skipped')

      await logActivity({
        action: 'RESEND_INVITATION',
        performedBy: performedBy || 'system',
        performedByEmail: performedByEmail || 'System',
        target: existing.email,
        metadata: { invitationId: id, emailSent }
      })
    }

    // Handle cancel
    if (body.status === 'cancelled' && existing.status !== 'cancelled') {
      console.log('[API] ✕ Cancel detected for:', existing.email)
      updates.updatedAt = new Date().toISOString()

      await logActivity({
        action: 'CANCEL_INVITATION',
        performedBy: performedBy || 'system',
        performedByEmail: performedByEmail || 'System',
        target: existing.email,
        metadata: { invitationId: id }
      })
    }

    await docRef.update(updates)

    const updated: Invitation = { ...existing, ...updates }

    return {
      success: true,
      data: updated,
      action: 'updated',
      emailSent
    }
  } catch (error: unknown) {
    console.error('[API] Error updating invitation:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({ statusCode: 500, message: 'Failed to update invitation' })
  }
})
