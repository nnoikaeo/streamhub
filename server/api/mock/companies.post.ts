import { readJSON, createItem, updateItem } from '../../utils/jsonDatabase'
import type { Company } from '~/types/admin'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/companies -', body)

    // Validate required fields
    if (!body.code && !body.id) {
      throw createError({
        statusCode: 400,
        message: 'Company code or id is required'
      })
    }

    const identifier = body.code || body.id

    // Check if it's create or update
    const companies = await readJSON<Company>('companies.json')
    const existingCompany = companies.find((c) => c.code === identifier || (c as { id?: string }).id === identifier)

    if (existingCompany) {
      // Update existing company
      const updated = await updateItem('companies.json', identifier, body)
      return {
        success: true,
        data: updated,
        action: 'updated'
      }
    } else {
      // Create new company
      const created = await createItem('companies.json', body)
      return {
        success: true,
        data: created,
        action: 'created'
      }
    }
  } catch (error: unknown) {
    console.error('[API] Error creating/updating company:', getErrorMessage(error))
    if (getErrorStatus(error)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to create/update company')
    })
  }
})
