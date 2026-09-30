/**
 * Tests for app/utils/displayName.ts
 *
 * The header showed the Google account's name while /admin/users showed the
 * name an admin had set — "Survey Streamwash" vs "ก ข" for the same account.
 */

import { describe, it, expect } from 'vitest'
import { resolveDisplayName } from '../../app/utils/displayName'

describe('resolveDisplayName', () => {
  it('prefers the name set on the profile over the Google name', () => {
    expect(resolveDisplayName('ก ข', 'Survey Streamwash')).toBe('ก ข')
  })

  it('falls back to the Google name when the profile has no name', () => {
    expect(resolveDisplayName(undefined, 'Survey Streamwash')).toBe('Survey Streamwash')
    expect(resolveDisplayName(null, 'Survey Streamwash')).toBe('Survey Streamwash')
  })

  it('treats a blank profile name as no name', () => {
    expect(resolveDisplayName('   ', 'Survey Streamwash')).toBe('Survey Streamwash')
  })

  it('returns null when neither has a name, so the menu can fall back to the email', () => {
    expect(resolveDisplayName(undefined, null)).toBeNull()
  })
})
