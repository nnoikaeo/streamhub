/**
 * Tests for app/utils/invitationCompany.ts — /admin/invitations showed the
 * invite-time company on accepted rows (survey: ORAY, now OAYT).
 */

import { describe, it, expect } from 'vitest'
import { invitationCompany } from '../../app/utils/invitationCompany'

const users = new Map([['survey', { uid: 'survey', company: 'OAYT' }]])
const codes = new Set(['OAYT', 'ORAY', 'STTH'])

describe('invitationCompany', () => {
  it('shows the current company on an accepted row, keeping the invite-time one', () => {
    expect(invitationCompany({ status: 'accepted', company: 'ORAY', acceptedByUid: 'survey' }, users, codes))
      .toEqual({ company: 'OAYT', invitedAs: 'ORAY' })
  })

  it('shows one company when the user has not moved', () => {
    expect(invitationCompany({ status: 'accepted', company: 'OAYT', acceptedByUid: 'survey' }, users, codes))
      .toEqual({ company: 'OAYT' })
  })

  it('falls back to the invitation when the user is gone or has no company', () => {
    expect(invitationCompany({ status: 'accepted', company: 'ORAY', acceptedByUid: 'deleted' }, users, codes))
      .toEqual({ company: 'ORAY' })
    expect(invitationCompany({ status: 'accepted', company: 'ORAY' }, users, codes))
      .toEqual({ company: 'ORAY' })
  })

  it('drops the hint when the old code is no longer a company — a rename, not a move', () => {
    expect(invitationCompany({ status: 'accepted', company: 'ORAY', acceptedByUid: 'survey' }, users, new Set(['OAYT'])))
      .toEqual({ company: 'OAYT' })
  })

  it('leaves rows that were never accepted alone', () => {
    expect(invitationCompany({ status: 'pending', company: 'ORAY', acceptedByUid: 'survey' }, users, codes))
      .toEqual({ company: 'ORAY' })
  })
})
