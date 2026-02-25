import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/companies')
    const companies = await readJSON('companies.json')
    return {
      success: true,
      data: companies,
      total: companies.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching companies:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read companies'
    })
  }
})
