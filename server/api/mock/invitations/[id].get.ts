import { findById } from '../../../utils/jsonDatabase'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    console.log('[API] GET /api/mock/invitations/:id -', id)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Invitation ID is required'
      })
    }

    const invitation = await findById('invitations.json', id)

    if (!invitation) {
      throw createError({
        statusCode: 404,
        message: `Invitation with ID "${id}" not found`
      })
    }

    return {
      success: true,
      data: invitation
    }
  } catch (error: unknown) {
    console.error('[API] Error fetching invitation:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch invitation'
    })
  }
})
