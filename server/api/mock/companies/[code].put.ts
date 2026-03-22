import { findById, updateItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const code = getRouterParam(event, 'code')
    const body = await readBody(event)
    console.log('[API] PUT /api/mock/companies/:code -', code)

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Company code is required'
      })
    }

    const existing = await findById('companies.json', code)
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Company with code "${code}" not found`
      })
    }

    const updates: Record<string, any> = {}
    const allowedFields = ['name', 'code', 'region', 'isActive', 'description', 'logo', 'address', 'phone', 'email', 'website']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updatedAt = new Date().toISOString()

    const updated = await updateItem('companies.json', code, updates)

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('[API] Error updating company:', error.message)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to update company'
    })
  }
})
