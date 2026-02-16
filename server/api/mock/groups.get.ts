import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/groups')
    const groups = await readJSON('groups.json')
    return {
      success: true,
      data: groups,
      total: groups.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching groups:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read groups'
    })
  }
})
