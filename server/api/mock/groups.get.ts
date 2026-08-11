import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async () => {
  try {
    console.log('[API] GET /api/mock/groups')
    const groups = await readJSON('groups.json')
    return {
      success: true,
      data: groups,
      total: groups.length
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching groups:', getErrorMessage(error))
    throw createError({
      statusCode: 500,
      message: 'Failed to read groups'
    })
  }
})
