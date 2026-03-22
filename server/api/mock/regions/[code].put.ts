import { findById, updateItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const code = getRouterParam(event, 'code')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/regions/:code -', code)

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Region code is required'
      })
    }

    const existing = await findById('regions.json', code)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Region with code "${code}" not found`
      })
    }

    const updates: Record<string, any> = {}
    const allowedFields = ['name', 'description', 'sortOrder', 'isActive']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updatedAt = new Date().toISOString()

    const updated = await updateItem('regions.json', code, updates)

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('[API] Error updating region:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update region'
    })
  }
})
