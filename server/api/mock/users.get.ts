import { readJSON } from '~/server/utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/users')
    const users = await readJSON('users.json')
    return {
      success: true,
      data: users
    }
  } catch (error: any) {
    console.error('[API] Error fetching users:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read users'
    })
  }
})
