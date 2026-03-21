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
