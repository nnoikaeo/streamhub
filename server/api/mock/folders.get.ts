import { readJSON, findById } from '../../utils/jsonDatabase'
import { filterAccessibleDashboards } from '../../utils/companyAccess'
import type { Dashboard, Folder, User } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('[API] GET /api/mock/folders')
    console.log('  📥 Query params:', query)

    const folders = await readJSON<Folder>('folders.json')
    console.log(`  📂 Total folders loaded: ${folders.length}`)

    let filtered = folders

    // Use verified auth context (from middleware) first, fallback to query param
    const uid = event.context.auth?.uid || (query.uid as string)
    if (uid) {
      const user = await findById<User>('users.json', uid)
      if (user && user.role !== 'admin') {
        if (user.role === 'moderator') {
          // Step 1: Assigned folders + all their descendants
          const assignedIds = new Set<string>(
            (folders)
              .filter((f) => f.assignedModerators?.includes(uid))
              .map((f) => f.id)
          )
          const addDescendants = (parentId: string) => {
            for (const f of folders) {
              if (f.parentId === parentId && !assignedIds.has(f.id)) {
                assignedIds.add(f.id)
                addDescendants(f.id)
              }
            }
          }
          for (const id of [...assignedIds]) {
            addDescendants(id)
          }

          // Step 2: Also include folders that contain accessible dashboards
          // (e.g. dashboards with access.company=[] meaning "all companies")
          const dashboards = await readJSON<Dashboard>('dashboards.json')
          const accessible = filterAccessibleDashboards(dashboards, user, folders)
          for (const d of accessible) {
            if (d.folderId && !assignedIds.has(d.folderId)) {
              assignedIds.add(d.folderId)
            }
          }

          filtered = filtered.filter((f) => assignedIds.has(f.id))
          console.log(`  🔍 After moderator filter (assigned + accessible): ${filtered.length}`)
        }
        // User: sees all folders (dashboard access filtered separately)
      }
    }

    if (query.parentId) {
      filtered = filtered.filter((f) => f.parentId === query.parentId)
      console.log(`  🔍 After parentId filter: ${filtered.length}`)
    }

    console.log(`  ✅ Returning: ${filtered.length} folders`)
    return {
      success: true,
      data: filtered,
      total: filtered.length
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching folders:', getErrorMessage(error))
    throw createError({
      statusCode: 500,
      message: 'Failed to read folders'
    })
  }
})
