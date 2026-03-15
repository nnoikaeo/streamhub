import { readJSON, deleteItem } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const code = getRouterParam(event, 'code')
    console.log('[API] DELETE /api/mock/regions/:code -', code)

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Region code is required'
      })
    }

    // Referential integrity check: prevent deletion if companies reference this region
    const companies = await readJSON('companies.json')
    const referencingCompanies = companies.filter((c: any) => c.region === code)

    if (referencingCompanies.length > 0) {
      throw createError({
        statusCode: 409,
        message: `ไม่สามารถลบกลุ่มธุรกิจ/เขตพื้นที่นี้ได้ เนื่องจากมี ${referencingCompanies.length} บริษัทที่ใช้งานอยู่`
      })
    }

    const deleted = await deleteItem('regions.json', code)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: `Region with code "${code}" not found`
      })
    }

    return {
      success: true,
      deleted: true,
      message: `Region "${code}" deleted successfully`
    }
  } catch (error: any) {
    console.error('[API] Error deleting region:', error.message)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to delete region'
    })
  }
})
