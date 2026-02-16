import { readJSON, createItem, updateItem } from '~/server/utils/jsonDatabase'

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
    const companies = await readJSON('companies.json')
    const existingCompany = companies.find((c: any) => c.code === identifier || c.id === identifier)

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
  } catch (error: any) {
    console.error('[API] Error creating/updating company:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create/update company'
    })
  }
})
