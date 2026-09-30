/**
 * Tests for app/utils/roleLabel.ts — one label per role for the menu and the
 * profile page, which used to show "user" and "ผู้ใช้ทั่วไป" side by side.
 */

import { describe, it, expect } from 'vitest'
import { roleLabel } from '../../app/utils/roleLabel'

describe('roleLabel', () => {
  it('names each role in Thai', () => {
    expect(roleLabel('admin')).toBe('ผู้ดูแลระบบ')
    expect(roleLabel('moderator')).toBe('ผู้ดูแลโฟลเดอร์')
    expect(roleLabel('user')).toBe('ผู้ใช้ทั่วไป')
  })

  it('treats a missing role as a plain user', () => {
    expect(roleLabel(undefined)).toBe('ผู้ใช้ทั่วไป')
    expect(roleLabel('')).toBe('ผู้ใช้ทั่วไป')
  })
})
