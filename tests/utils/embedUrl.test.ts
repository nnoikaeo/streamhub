/**
 * Tests for shared/utils/embedUrl.ts
 *
 * The strip is the security boundary: a dashboard's embed URL only ever leaves
 * the server sealed inside an embed token. It used to be written out three
 * times with the field name spelled in each, which is why adding a second embed
 * type needed one list instead. These lock the list to the fields that exist.
 */

import { describe, it, expect } from 'vitest'
import { getEmbedUrl, stripEmbedUrls, EMBED_URL_FIELDS } from '../../shared/utils/embedUrl'

const LOOKER_URL = 'https://lookerstudio.google.com/embed/reporting/abc-123'
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/file_id/edit?rm=minimal&widget=true&headers=false'

describe('getEmbedUrl', () => {
  it('picks the looker URL for a looker dashboard', () => {
    expect(getEmbedUrl({ type: 'looker', lookerEmbedUrl: LOOKER_URL })).toBe(LOOKER_URL)
  })

  it('picks the sheet URL for a sheet dashboard', () => {
    expect(getEmbedUrl({ type: 'sheet', sheetEmbedUrl: SHEET_URL })).toBe(SHEET_URL)
  })

  it('never crosses the two — a sheet dashboard does not fall back to a stale looker URL', () => {
    // A dashboard converted from looker to sheet keeps the old field. Falling
    // back would frame the previous report under the new dashboard's name.
    expect(getEmbedUrl({ type: 'sheet', lookerEmbedUrl: LOOKER_URL })).toBeUndefined()
    expect(getEmbedUrl({ type: 'looker', sheetEmbedUrl: SHEET_URL })).toBeUndefined()
  })

  it('returns undefined when nothing is configured', () => {
    expect(getEmbedUrl({ type: 'looker' })).toBeUndefined()
  })
})

describe('stripEmbedUrls', () => {
  const dashboard = {
    id: 'dash_001',
    name: 'Sales',
    type: 'sheet' as const,
    lookerEmbedUrl: LOOKER_URL,
    sheetEmbedUrl: SHEET_URL,
    sheetEmbedMode: 'interactive' as const,
  }

  it('removes every embed URL field', () => {
    const stripped = stripEmbedUrls(dashboard)

    expect(stripped).not.toHaveProperty('lookerEmbedUrl')
    expect(stripped).not.toHaveProperty('sheetEmbedUrl')
  })

  it('keeps everything else, including the mode', () => {
    expect(stripEmbedUrls(dashboard)).toEqual({
      id: 'dash_001',
      name: 'Sales',
      type: 'sheet',
      sheetEmbedMode: 'interactive',
    })
  })

  it('does not mutate the input — handlers reuse the row', () => {
    stripEmbedUrls(dashboard)

    expect(dashboard.sheetEmbedUrl).toBe(SHEET_URL)
  })

  it('handles a dashboard with no embed URL at all', () => {
    expect(stripEmbedUrls({ id: 'dash_002', type: 'looker' as const })).toEqual({ id: 'dash_002', type: 'looker' })
  })

  it('strips every field the list names', () => {
    // Guards the pairing: a field added to EMBED_URL_FIELDS but not removed by
    // the loop would leak while looking handled.
    const withAll = Object.fromEntries(EMBED_URL_FIELDS.map(field => [field, 'secret']))
    const stripped = stripEmbedUrls({ ...withAll, id: 'dash_003' })

    expect(JSON.stringify(stripped)).not.toContain('secret')
  })
})
