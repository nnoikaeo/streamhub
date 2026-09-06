/**
 * Tests for app/utils/sheetSharingGuard.ts
 *
 * The sharing check was advisory when it first shipped: it reported HTTP 401
 * correctly and the form saved the dashboard anyway, which produced exactly the
 * Safari cookie dead-end it was built to prevent. These lock in which states
 * stop a save and, just as importantly, which ones must not.
 */

import { describe, it, expect } from 'vitest'
import { sheetSaveBlockReason, type SheetSharingStatus } from '../../app/utils/sheetSharingGuard'

const ALL_STATUSES: SheetSharingStatus[] = ['unknown', 'checking', 'shared', 'not-shared', 'error']

describe('sheetSaveBlockReason', () => {
  it('blocks a sheet the check found unshared', () => {
    expect(sheetSaveBlockReason('sheet', 'not-shared')).toContain('ทุกคนที่มีลิงก์')
  })

  it('blocks while a check is still running, so a save cannot outrun the answer', () => {
    expect(sheetSaveBlockReason('sheet', 'checking')).toBeTruthy()
  })

  it('allows a sheet the check found shared', () => {
    expect(sheetSaveBlockReason('sheet', 'shared')).toBeUndefined()
  })

  it('does not block when the probe itself failed', () => {
    // Refusing to save because our own request to Google failed is worse than
    // saving a sheet whose sharing we could not read; the form still says so.
    expect(sheetSaveBlockReason('sheet', 'error')).toBeUndefined()
  })

  it('does not block before any check has run', () => {
    expect(sheetSaveBlockReason('sheet', 'unknown')).toBeUndefined()
  })

  it('never blocks a looker dashboard, whatever the sheet state says', () => {
    // The state is left behind when the type is switched back; reading it for
    // a looker dashboard would block a save for a field nothing uses.
    for (const status of ALL_STATUSES) {
      expect({ status, reason: sheetSaveBlockReason('looker', status) })
        .toEqual({ status, reason: undefined })
    }
  })
})
