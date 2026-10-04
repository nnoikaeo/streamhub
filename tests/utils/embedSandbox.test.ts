/**
 * Tests for app/utils/embedSandbox.ts
 *
 * Every keyword here was measured on production, and a missing one fails
 * silently inside a cross-origin frame — no error reaches StreamHub. These
 * tests are the only thing that notices a keyword added to or dropped from
 * the wrong embed type.
 */

import { describe, it, expect } from 'vitest'
import { getEmbedSandbox } from '../../app/utils/embedSandbox'

const keywords = (type: Parameters<typeof getEmbedSandbox>[0]) => getEmbedSandbox(type).split(' ')

describe('getEmbedSandbox', () => {
  it('lets a Looker report download its exported data', () => {
    expect(keywords('looker')).toContain('allow-downloads')
  })

  it('treats a row with no type as Looker', () => {
    expect(getEmbedSandbox(undefined)).toBe(getEmbedSandbox('looker'))
  })

  it('keeps downloads blocked for a sheet', () => {
    expect(keywords('sheet')).not.toContain('allow-downloads')
  })

  it('never lets a sheet navigate the top window', () => {
    expect(keywords('sheet')).not.toContain('allow-top-navigation-by-user-activation')
    expect(keywords('looker')).toContain('allow-top-navigation-by-user-activation')
  })

  it.each(['looker', 'sheet'] as const)('gives %s the keywords both types need', (type) => {
    expect(keywords(type)).toEqual(expect.arrayContaining([
      'allow-scripts',
      'allow-same-origin',
      'allow-popups',
      'allow-forms',
      'allow-storage-access-by-user-activation',
    ]))
  })

  it.each(['looker', 'sheet'] as const)('does not let %s open modals', (type) => {
    expect(keywords(type)).not.toContain('allow-modals')
  })
})
