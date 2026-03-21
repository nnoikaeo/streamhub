import { readJSON } from '../../../utils/jsonDatabase'
import type { Invitation } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] GET /api/mock/invitations')

    const query = getQuery(event)
    const company = query.company as string | undefined
    const status = query.status as string | undefined

    let invitations = await readJSON<Invitation>('invitations.json')

    if (company) {
      invitations = invitations.filter(inv => inv.company === company)
    }

    if (status) {
      invitations = invitations.filter(inv => inv.status === status)
    }

    return {
      success: true,
      data: invitations,
      total: invitations.length
    }
  } catch (error: any) {
    console.error('[API] Error fetching invitations:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to read invitations'
    })
  }
})
