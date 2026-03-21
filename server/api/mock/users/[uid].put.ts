import { findById, updateItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'

export default defineEventHandler(async (event) => {
  try {
    const uid = getRouterParam(event, 'uid')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/users/:uid -', uid)

    if (!uid) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    const existing = await findById('users.json', uid)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `User with ID "${uid}" not found`
      })
    }

    const updates: Record<string, any> = {}
    const allowedFields = ['name', 'role', 'company', 'groups', 'isActive', 'assignedFolders']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updatedAt = new Date().toISOString()

    const updated = await updateItem('users.json', uid, updates)

    // Audit log for status toggle
    if (body.isActive !== undefined && body.isActive !== (existing as any).isActive) {
      await logActivity({
        action: body.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        performedBy: body.performedBy || 'admin',
        performedByEmail: body.performedByEmail || 'admin',
        target: (existing as any).email || uid,
        metadata: { uid, isActive: body.isActive }
      })
    }

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('[API] Error updating user:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update user'
    })
  }
})
