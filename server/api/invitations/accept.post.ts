import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../utils/firestoreAdmin'
import { logActivity } from '../../utils/auditLog'
import { planInviteMembership } from '../../utils/inviteMembership'
import type { Invitation, StoredUser } from '~/types/invitation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[API] POST /api/invitations/accept')

    const { invitationCode, uid, email, displayName, photoURL } = body

    if (!invitationCode || !uid || !email || !displayName) {
      throw createError({
        statusCode: 400,
        message: 'invitationCode, uid, email, and displayName are required'
      })
    }

    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 503, message: 'Firestore not available' })
    }

    // Find invitation by code
    const snap = await db.collection('invitations')
      .where('invitationCode', '==', invitationCode)
      .limit(1)
      .get()

    if (snap.empty) {
      return { success: false, error: 'Invitation not found' }
    }

    const invDoc = snap.docs[0]!
    const invitation = { ...invDoc.data(), id: invDoc.id } as Invitation

    // Security Check 1 — Email Matching (case-insensitive)
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: 'Email mismatch', message: 'The email you signed in with does not match the invitation email' }
    }

    // Security Check 2 — Race Condition Prevention
    if (invitation.status !== 'pending') {
      return { success: false, error: 'Already processed', message: 'This invitation has already been ' + invitation.status }
    }

    // Security Check 3 — Server-side Expiry
    if (new Date(invitation.expiresAt) <= new Date()) {
      await db.collection('invitations').doc(invDoc.id).update({ status: 'expired', updatedAt: new Date().toISOString() })
      return { success: false, error: 'Expired', message: 'This invitation has expired' }
    }

    const now = new Date().toISOString()

    // Update invitation status
    const invitationUpdates = {
      status: 'accepted' as const,
      acceptedAt: now,
      acceptedByUid: uid,
      updatedAt: now
    }
    await db.collection('invitations').doc(invDoc.id).update(invitationUpdates)

    const updatedInvitation: Invitation = { ...invitation, ...invitationUpdates }

    // Create new user in Firestore
    const newUser: StoredUser = {
      uid,
      email,
      name: displayName,
      role: invitation.role,
      company: invitation.company,
      groups: groupsForRole(invitation.role, invitation.assignedGroups),
      isActive: true,
      createdAt: now,
      updatedAt: now
    }

    if (photoURL) {
      newUser.photoURL = photoURL
    }

    if (invitation.role === 'moderator' && invitation.assignedFolders?.length) {
      newUser.assignedFolders = invitation.assignedFolders
    }

    // The user doc and the mirrored membership go in one batch, so an accepted
    // invite never leaves a user named by nothing on the group/folder side.
    const groupIds = newUser.groups
    const folderIds = newUser.assignedFolders ?? []
    const [groupSnaps, folderSnaps] = await Promise.all([
      groupIds.length ? db.getAll(...groupIds.map(id => db.collection('groups').doc(id))) : [],
      folderIds.length ? db.getAll(...folderIds.map(id => db.collection('folders').doc(id))) : [],
    ])
    const plan = planInviteMembership({
      uid,
      role: newUser.role,
      groupIds,
      folderIds,
      groups: groupSnaps.filter(s => s.exists).map(s => ({ id: s.id, members: s.get('members') as string[] | undefined })),
      folders: folderSnaps.filter(s => s.exists).map(s => ({ id: s.id, assignedModerators: s.get('assignedModerators') as string[] | undefined })),
    })

    const batch = db.batch()
    batch.set(db.collection('users').doc(uid), newUser)
    for (const id of plan.groupIds) {
      batch.update(db.collection('groups').doc(id), { members: FieldValue.arrayUnion(uid) })
    }
    for (const id of plan.folderIds) {
      batch.update(db.collection('folders').doc(id), { assignedModerators: FieldValue.arrayUnion(uid) })
    }
    await batch.commit()

    // Audit log
    await logActivity({
      action: 'ACCEPT_INVITATION',
      performedBy: uid,
      performedByEmail: email,
      target: email,
      metadata: { invitationId: invitation.id, role: invitation.role, company: invitation.company }
    })

    return {
      success: true,
      data: {
        invitation: updatedInvitation,
        user: newUser
      }
    }
  } catch (error: unknown) {
    console.error('[API] Error accepting invitation:', getErrorMessage(error))
    if (getErrorStatus(error)) throw error
    throw createError({
      statusCode: 500,
      message: getErrorMessage(error, 'Failed to accept invitation')
    })
  }
})
