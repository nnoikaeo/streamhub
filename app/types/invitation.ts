export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface Invitation {
  id: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  status: InvitationStatus
  invitedBy: string
  invitedByName: string
  message?: string
  assignedFolders?: string[]
  assignedGroups?: string[]

  // Tracking — UUID v4 (Security Pattern 3)
  invitationCode: string
  expiresAt: string
  createdAt: string
  updatedAt: string

  // Acceptance data (Phase 2 of Two-Phase Verification)
  acceptedAt?: string
  acceptedByUid?: string
}

export interface CreateInvitationInput {
  email: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  message?: string
  assignedFolders?: string[]
  assignedGroups?: string[]
  expiresInDays?: number
}

export interface BulkInviteInput {
  emails: string[]
  role: 'user' | 'moderator' | 'admin'
  company: string
  message?: string
  assignedFolders?: string[]
  assignedGroups?: string[]
}

export interface InvitationStats {
  total: number
  pending: number
  accepted: number
  expired: number
  cancelled: number
}

export type InvitationAction =
  | 'INVITE_USER'
  | 'CANCEL_INVITATION'
  | 'RESEND_INVITATION'
  | 'ACCEPT_INVITATION'
  | 'REACTIVATE_USER'
  | 'BULK_INVITE'

// ============================================================================
// API RESPONSES
//
// `useServiceMode().apiBase('invitations')` picks between
// `server/api/invitations/**` (Firestore) and `server/api/mock/invitations/**`
// (JSON) at runtime. The two return identical shapes, so one set of types
// covers both — keep them in step when either side changes.
//
// The failure branches are values, not thrown errors: handlers only throw for
// unexpected faults, and rethrow anything that already carries a statusCode.
// ============================================================================

/** GET `{apiBase}` — list. Only the mock route implements this. */
export interface InvitationListResponse {
  success: true
  data: Invitation[]
  total: number
}

/** GET `{apiBase}/check?email=` — is there a pending invitation for this email. */
export interface InvitationCheckResponse {
  success: true
  data: Invitation | null
  found: boolean
}

/** The subset `verify` is allowed to echo back — deliberately no invitationCode. */
export interface InvitationVerifyData {
  email: string
  role: Invitation['role']
  company: string
  message?: string
  expiresAt: string
}

/** GET `{apiBase}/verify?code=` */
export type InvitationVerifyResponse =
  | {
      success: false
      status: 'not_found' | 'already_accepted' | 'cancelled' | 'expired' | 'invalid'
    }
  | {
      success: true
      status: 'valid'
      data: InvitationVerifyData
    }

/**
 * A stored user row, as the invitation flow writes and returns it.
 *
 * Not `User`: that type declares `createdAt`/`updatedAt` as `Date`, while both
 * the JSON store and Firestore hold ISO strings. This names the shape actually
 * on the wire.
 */
export interface StoredUser {
  uid: string
  email: string
  name: string
  role: string
  company: string
  groups: string[]
  isActive: boolean
  assignedFolders?: string[]
  photoURL?: string
  createdAt?: string
  updatedAt?: string
}

/** POST `{apiBase}/accept` */
export type InvitationAcceptResponse =
  | { success: false, error: string, message?: string }
  | { success: true, data: { invitation: Invitation, user: StoredUser } }

/** POST `{apiBase}` — create. Both failure branches carry the clashing user. */
export type InvitationCreateResponse =
  | {
      success: false
      error: 'User already active'
      existingUser: { uid: string, email: string }
    }
  | {
      success: false
      action: 'user_exists_inactive'
      existingUser: { uid: string, email: string, role: string, company: string }
    }
  | {
      success: true
      data: Invitation
      action: 'created'
      emailSent: boolean
    }

/** PUT `{apiBase}/:id` — also the resend path, which reissues invitationCode. */
export interface InvitationUpdateResponse {
  success: true
  data: Invitation
  action: 'updated'
  emailSent: boolean
}

/** POST `{apiBase}/bulk` */
export interface InvitationBulkResponse {
  success: true
  data: {
    created: Invitation[]
    skipped: { email: string, reason: string }[]
    emailsSent: number
    emailsFailed: number
  }
}

/** POST `{apiBase}/reactivate` — revives a soft-deleted user. */
export interface InvitationReactivateResponse {
  success: true
  data: StoredUser
}
