import { updateItem, findById } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/invitations/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Invitation ID is required'
      })
    }

    const existing = await findById<Invitation>('invitations.json', id)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Invitation with ID "${id}" not found`
      })
    }

    const updates: Partial<Invitation> = { ...body }

    // Handle resend: reset expiry + new invitation code
    if (body.status === 'pending' && existing.status !== 'pending') {
      updates.invitationCode = crypto.randomUUID()
      updates.expiresAt = updates.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      await logActivity({
        action: 'RESEND_INVITATION',
        performedBy: body.performedBy || 'system',
        performedByEmail: body.performedByEmail || 'System',
        target: existing.email,
        metadata: { invitationId: id }
      })
    }

    // Handle cancel
    if (body.status === 'cancelled' && existing.status !== 'cancelled') {
      await logActivity({
        action: 'CANCEL_INVITATION',
        performedBy: body.performedBy || 'system',
        performedByEmail: body.performedByEmail || 'System',
        target: existing.email,
        metadata: { invitationId: id }
      })
    }

    const updated = await updateItem('invitations.json', id, updates)

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: `Invitation with ID "${id}" not found`
      })
    }

    return {
      success: true,
      data: updated,
      action: 'updated'
    }
  } catch (error: any) {
    console.error('[API] Error updating invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update invitation'
    })
  }
})
