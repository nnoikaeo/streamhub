import { findById, updateItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/groups/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Group ID is required'
      })
    }

    const existing = await findById('groups.json', id)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Group with ID "${id}" not found`
      })
    }

    const updates: Record<string, any> = {}
    const allowedFields = ['name', 'description', 'members', 'isActive']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updatedAt = new Date().toISOString()

    const updated = await updateItem('groups.json', id, updates)

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('[API] Error updating group:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update group'
    })
  }
})
