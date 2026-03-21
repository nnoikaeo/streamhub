import { readJSON, writeJSON } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'

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
    console.log('[API] POST /api/mock/invitations/reactivate -', body.email)

    const { email, role, company, groups, performedBy, performedByEmail } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required'
      })
    }

    const users = await readJSON<UserRecord>('users.json')
    const userIndex = users.findIndex(u => u.email === email && !u.isActive)

    if (userIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'No inactive user found with this email'
      })
    }

    const now = new Date().toISOString()
    const user = users[userIndex]!
    const updatedUser: UserRecord = {
      ...user,
      isActive: true,
      role: role || user.role,
      company: company || user.company,
      groups: groups || user.groups,
      updatedAt: now
    }
    users[userIndex] = updatedUser

    await writeJSON('users.json', users)

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
