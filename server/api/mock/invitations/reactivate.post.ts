import { readJSON, writeJSON, updateItem } from '../../../utils/jsonDatabase'
import { logActivity } from '../../../utils/auditLog'
import { planGroupMembership } from '../../../utils/inviteMembership'
import type { StoredUser } from '~/types/invitation'
import type { AdminGroup } from '~/types/admin'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/mock/invitations/reactivate -', body.email)

    const { email, role, company, groups, performedBy, performedByEmail } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required'
      })
    }

    const users = await readJSON<StoredUser>('users.json')
    const userIndex = users.findIndex(u => u.email === email && !u.isActive)

    if (userIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'No inactive user found with this email'
      })
    }

    const now = new Date().toISOString()
    const user = users[userIndex]!
    const updatedUser: StoredUser = {
      ...user,
      isActive: true,
      role: role || user.role,
      company: company || user.company,
      groups: groupsForRole(role || user.role, groups || user.groups),
      updatedAt: now
    }
    users[userIndex] = updatedUser

    await writeJSON('users.json', users)

    // Mirror the rewritten groups[] onto groups.members[] — see planGroupMembership
    const allGroups = await readJSON<AdminGroup>('groups.json')
    const plan = planGroupMembership({ uid: updatedUser.uid, groupIds: updatedUser.groups, groups: allGroups })
    for (const id of [...plan.join, ...plan.leave]) {
      const members = allGroups.find(g => g.id === id)?.members ?? []
      const next = plan.join.includes(id) ? [...members, updatedUser.uid] : members.filter(m => m !== updatedUser.uid)
      await updateItem<AdminGroup>('groups.json', id, { members: next })
    }

    // Audit log
    await logActivity({
      action: 'REACTIVATE_USER',
      performedBy: performedBy || 'system',
      performedByEmail: performedByEmail || 'System',
      target: email,
      metadata: { uid: updatedUser.uid, role: updatedUser.role, company: updatedUser.company }
    })

    return {
      success: true,
      data: updatedUser
    }
  } catch (error: unknown) {
    console.error('[API] Error reactivating user:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to reactivate user')
    })
  }
})
