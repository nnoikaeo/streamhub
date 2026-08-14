import { readJSON, createItem, updateItem } from '../../utils/jsonDatabase'
import type { Region } from '~/types/admin'

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
    const regions = await readJSON<Region>('regions.json')
    const existingRegion = regions.find((r) => r.code === identifier || (r as { id?: string }).id === identifier)

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
  } catch (error: unknown) {
    console.error('[API] Error creating/updating region:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to create/update region')
    })
  }
})
