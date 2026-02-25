import { deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const code = getRouterParam(event, 'code')
    console.log('[API] DELETE /api/mock/companies/:code -', code)

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Company code is required'
      })
    }

    const deleted = await deleteItem('companies.json', code)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Company with code "${code}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Company "${code}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting company:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete company'
    })
  }
})
