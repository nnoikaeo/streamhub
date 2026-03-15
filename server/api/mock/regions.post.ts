import { readJSON, createItem, updateItem } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/regions -', body)

    // Validate required fields
    if (!body.code && !body.id) {
      throw createError({
        statusCode: 400,
        message: 'Region code or id is required'
      })
    }

    const identifier = body.code || body.id

    // Check if it's create or update
    const regions = await readJSON('regions.json')
    const existingRegion = regions.find((r: any) => r.code === identifier || r.id === identifier)

    if (existingRegion) {
      // Update existing region
      const updated = await updateItem('regions.json', identifier, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new region
      const created = await createItem('regions.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating region:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update region'
    })
  }
})
