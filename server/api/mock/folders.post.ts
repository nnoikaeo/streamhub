import { readJSON, createItem, updateItem } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/folders -', body)

    // Validate required fields
    if (!body.id) {
      throw createError({
        statusCode: 400,
        message: 'Folder id is required'
      })
    }

    // Check if it's create or update
    const folders = await readJSON('folders.json')
    const existingFolder = folders.find((f: any) => f.id === body.id)

    if (existingFolder) {
      // Update existing folder
      const updated = await updateItem('folders.json', body.id, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new folder
      const created = await createItem('folders.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating folder:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update folder'
    })
  }
})
