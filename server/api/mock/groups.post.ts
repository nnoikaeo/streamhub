import { readJSON, createItem, updateItem } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/groups -', body)

    // Validate required fields
    if (!body.code && !body.id) {
      throw createError({
        statusCode: 400,
        message: 'Group code or id is required'
      })
    }

    const identifier = body.code || body.id

    // Check if it's create or update
    const groups = await readJSON('groups.json')
    const existingGroup = groups.find((g: any) => g.code === identifier || g.id === identifier)

    if (existingGroup) {
      // Update existing group
      const updated = await updateItem('groups.json', identifier, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new group
      const created = await createItem('groups.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating group:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update group'
    })
  }
})
