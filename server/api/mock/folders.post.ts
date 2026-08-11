import { readJSON, createItem, updateItem } from '../../utils/jsonDatabase'

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
  } catch (error: unknown) {
    console.error('[API] Error creating/updating folder:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to create/update folder')
    })
  }
})
