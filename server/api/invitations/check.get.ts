import { getAdminDb } from '../../utils/firestoreAdmin'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const email = query.email as string
    console.log('[API] GET /api/invitations/check -', email)

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email query parameter is required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    const now = new Date()
    const snap = await db.collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get()

    const pending = snap.docs
      .map(d => ({ ...d.data(), id: d.id }) as Invitation)
      .find(inv => new Date(inv.expiresAt) > now)

    return {
      success: true,
      data: pending || null,
      found: !!pending
    }
  } catch (error: any) {
    console.error('[API] Error checking invitation:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to check invitation'
    })
  }
})
