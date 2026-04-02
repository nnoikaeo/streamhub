import { getAdminDb, fsQuery } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'

interface UserRecord {
  uid: string
  email: string
  name: string
  role: string
  company: string
  groups: string[]
  isActive: boolean
  [key: string]: any
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/invitations/reactivate -', body.email)

    const { email, role, company, groups, performedBy, performedByEmail } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    const users = await fsQuery<UserRecord>(db, 'users', 'email', email)
    const inactiveUser = users.find(u => !u.isActive)

    if (!inactiveUser) {
      throw createError({
        statusCode: 404,
        message: 'No inactive user found with this email'
      })
    }

    const now = new Date().toISOString()
    const updates: Partial<UserRecord> = {
      isActive: true,
      role: role || inactiveUser.role,
      company: company || inactiveUser.company,
      groups: groups || inactiveUser.groups,
      updatedAt: now
    }

    await db.collection('users').doc(inactiveUser.uid).update(updates)

    const updatedUser: UserRecord = { ...inactiveUser, ...updates }

    // Audit log
    await logActivity({
      action: 'REACTIVATE_USER',
      performedBy: performedBy || 'system',
      performedByEmail: performedByEmail || 'System',
      target: email,
      metadata: { uid: updatedUser.uid, role: updatedUser.role, company: updatedUser.company }
    })

    return {
      success: true,
      data: updatedUser
    }
  } catch (error: any) {
    console.error('[API] Error reactivating user:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to reactivate user'
    })
  }
})
