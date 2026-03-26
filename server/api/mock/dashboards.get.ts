import { readJSON } from '../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const uid = query.uid as string
    const companyFilter = query.company as string

    // If uid provided: validate company access and filter by permissions
    if (uid) {
      const accessResult = await validateCompanyAccess(event, companyFilter)
      if (!accessResult.allowed) {
        return sendForbidden(event, accessResult.reason)
      }

      const dashboards = await readJSON('dashboards.json')
      const folders = await readJSON('folders.json')

      let filtered = filterAccessibleDashboards(dashboards as any[], accessResult.user, folders as any[])

      if (query.folderId) {
        filtered = filtered.filter((d: any) => d.folderId === query.folderId)
      }

      // Strip lookerEmbedUrl from listing response (security: hide embed URLs)
      const sanitized = filtered.map(({ lookerEmbedUrl, ...rest }: any) => rest)

      return { success: true, data: sanitized, total: sanitized.length }
    }

    // Fallback: no uid (admin pages, backward compatible)
    const dashboards = await readJSON('dashboards.json')

    let filtered: any[] = dashboards as any[]

    if (companyFilter) {
      filtered = filtered.filter((d: any) => d.access?.company?.[companyFilter])
    }

    if (query.folderId) {
      filtered = filtered.filter((d: any) => d.folderId === query.folderId)
    }

    // Strip lookerEmbedUrl from listing response (security: hide embed URLs)
    const sanitized = filtered.map(({ lookerEmbedUrl, ...rest }: any) => rest)

    return { success: true, data: sanitized, total: sanitized.length }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to read dashboards'
    })
  }
})
