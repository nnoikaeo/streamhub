/**
 * Which company an invitation row shows on /admin/invitations.
 *
 * `invitations.company` is the company at invite time and is never updated,
 * so an accepted row went stale once an admin moved the user: survey was
 * invited into ORAY, now belongs to OAYT, and the row still said ORAY. An
 * accepted row now shows the user's current company, with the invite-time one
 * kept as `invitedAs` when the two differ. Pending, expired and cancelled rows
 * have no user yet and show the invitation's own company.
 */

interface InvitationLike {
  status: string
  company: string
  acceptedByUid?: string
}

interface UserLike {
  uid: string
  company?: string
}

export interface InvitationCompany {
  company: string
  /** The company the invitation named, when the user has since moved */
  invitedAs?: string
}

export function invitationCompany(
  invitation: InvitationLike,
  usersByUid: ReadonlyMap<string, UserLike>,
): InvitationCompany {
  const uid = invitation.status === 'accepted' ? invitation.acceptedByUid : undefined
  const current = uid ? usersByUid.get(uid)?.company : undefined
  if (!current || current === invitation.company) return { company: invitation.company }
  return { company: current, invitedAs: invitation.company }
}
