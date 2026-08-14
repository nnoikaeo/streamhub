import { readJSON } from '../../utils/jsonDatabase'
import type { Dashboard, Folder } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    // Use verified auth context (from middleware) first, fallback to query param
    const uid = event.context.auth?.uid || (query.uid as string)
    const companyFilter = query.company as string

    // If uid provided: validate company access and filter by permissions
    if (uid) {
      const accessResult = await validateCompanyAccess(event, companyFilter)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const dashboards = await readJSON<Dashboard>('dashboards.json')
      const folders = await readJSON<Folder>('folders.json')

      let filtered = filterAccessibleDashboards(dashboards, accessResult.user, folders)

      if (query.folderId) {
        filtered = filtered.filter((d) => d.folderId === query.folderId)
      }

      // Strip lookerEmbedUrl from listing response (security: hide embed URLs)
      const sanitized = filtered.map(({ lookerEmbedUrl, ...rest }) => rest)

      return { success: true, data: sanitized, total: sanitized.length }
    }

    // Fallback: no uid (admin pages, backward compatible)
    const dashboards = await readJSON<Dashboard>('dashboards.json')

    let filtered = dashboards

    if (companyFilter) {
      // access.company is a list of company codes, not a map — indexing it with
      // a code always yielded undefined, so this filter returned nothing.
      // companyAccess.ts:122 gets this right with .includes().
      filtered = filtered.filter((d) => d.access?.company?.includes(companyFilter))
    }

    if (query.folderId) {
      filtered = filtered.filter((d) => d.folderId === query.folderId)
    }

    // Strip lookerEmbedUrl from listing response (security: hide embed URLs)
    const sanitized = filtered.map(({ lookerEmbedUrl, ...rest }) => rest)

    return { success: true, data: sanitized, total: sanitized.length }
  } catch {
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboards'
    })
  }
})
