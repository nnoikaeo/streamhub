import { readJSON, createItem, updateItem } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/users -', body)

    // Validate required fields
    if (!body.uid) {
      throw createError({
        statusCode: 400,
        message: 'User uid is required'
      })
    }

    // Check if it's create or update
    const users = await readJSON('users.json')
    const existingUser = users.find((u: any) => u.uid === body.uid)

    if (existingUser) {
      // Update existing user
      const updated = await updateItem('users.json', body.uid, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new user
      const created = await createItem('users.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: any) {
    console.error('[API] Error creating/updating user:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update user'
    })
  }
})
