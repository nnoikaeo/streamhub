import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb, fsQuery } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import type { StoredUser } from '~/types/invitation'
import { planGroupMembership } from '../../utils/inviteMembership'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/invitations/reactivate -', body.email)

    const { email, role, company, groups, performedBy, performedByEmail } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    const users = await fsQuery<StoredUser>(db, 'users', 'email', email)
    const inactiveUser = users.find(u => !u.isActive)

    if (!inactiveUser) {
      throw createError({
        statusCode: 404,
        message: 'No inactive user found with this email'
      })
    }

    const now = new Date().toISOString()
    const updates: Partial<StoredUser> = {
      isActive: true,
      role: role || inactiveUser.role,
      company: company || inactiveUser.company,
      groups: groupsForRole(role || inactiveUser.role, groups || inactiveUser.groups),
      updatedAt: now
    }

    // Mirror the rewritten groups[] onto groups.members[] in the same batch —
    // see planGroupMembership (BUG-040 pattern).
    const groupSnaps = await db.collection('groups').get()
    const plan = planGroupMembership({
      uid: inactiveUser.uid,
      groupIds: updates.groups ?? [],
      groups: groupSnaps.docs.map(d => ({ id: d.id, members: d.get('members') as string[] | undefined })),
    })
    const batch = db.batch()
    batch.update(db.collection('users').doc(inactiveUser.uid), updates)
    for (const id of plan.join) batch.update(db.collection('groups').doc(id), { members: FieldValue.arrayUnion(inactiveUser.uid) })
    for (const id of plan.leave) batch.update(db.collection('groups').doc(id), { members: FieldValue.arrayRemove(inactiveUser.uid) })
    await batch.commit()

    const updatedUser: StoredUser = { ...inactiveUser, ...updates }

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
