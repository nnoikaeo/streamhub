import { readJSON } from '../../utils/jsonDatabase'
import type { Company } from '~/types/admin'

export default defineEventHandler(async () => {
  try {
    console.log('[API] GET /api/mock/companies')
    const companies = await readJSON<Company>('companies.json')
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
