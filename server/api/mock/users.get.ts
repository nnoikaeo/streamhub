import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/users')
    const users = await readJSON('users.json')
    console.log(`  👥 Total users: ${users.length}`)
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
