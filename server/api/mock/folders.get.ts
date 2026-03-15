import { readJSON, findById } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/folders')
    console.log('  📥 Query params:', query)

    const folders = await readJSON('folders.json')
    console.log(`  📂 Total folders loaded: ${folders.length}`)

    let filtered: any[] = folders as any[]

    // If uid provided: filter by role
    const uid = query.uid as string
    if (uid) {
      const user = await findById('users.json', uid)
      if (user && (user as any).role !== 'admin') {
        if ((user as any).role === 'moderator') {
          // Moderator: only assigned folders
          filtered = filtered.filter((f: any) => f.assignedModerators?.includes(uid))
          console.log(`  🔍 After moderator filter: ${filtered.length}`)
        }
        // User: sees all folders (dashboard access filtered separately)
      }
    }

    if (query.parentId) {
      filtered = filtered.filter((f: any) => f.parentId === query.parentId)
      console.log(`  🔍 After parentId filter: ${filtered.length}`)
    }

    console.log(`  ✅ Returning: ${filtered.length} folders`)
    return {
      success: true,
      data: filtered,
      total: filtered.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching folders:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read folders'
    })
  }
})
