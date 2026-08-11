import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async () => {
  try {
    console.log('[API] GET /api/mock/companies')
    const companies = await readJSON('companies.json')
    return {
      success: true,
      data: companies,
      total: companies.length
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching companies:', getErrorMessage(error))
    throw createError({
      statusCode: 500,
      message: 'Failed to read companies'
    })
  }
})
