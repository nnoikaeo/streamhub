/**
 * Tests for shared/utils/sheetUrl.ts
 *
 * Two shapes go in — a document URL and a "publish to the web" URL — and the
 * pair are not interchangeable: the published id under `/d/e/…` is a different
 * id from the file id and cannot be derived from it (spike S1.6). The cases
 * that matter most are the ones where a wrong parse still looks like a URL,
 * because the failure then shows up as an empty iframe with nothing logged.
 */

import { describe, it, expect } from 'vitest'
import { parseSheetUrl, toSheetEmbedUrl, extractSheetId, isValidSheetUrl, sheetProbeUrl } from '../../shared/utils/sheetUrl'

const FILE_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
const PUBLISHED_ID = '2PACX-1vShmrFx35RtYdfEeHDCEzsZNSyaPYxqdjAb77CR030Gdr064_kSBSS3P_LkI3ovtIjbVRdclV5zswxT'

const docUrl = (suffix = '/edit?gid=0#gid=0') => `https://docs.google.com/spreadsheets/d/${FILE_ID}${suffix}`
const publishedUrl = (suffix = '/pubhtml') => `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_ID}${suffix}`

describe('parseSheetUrl — document URL', () => {
  it('defaults to interactive: /edit?rm=minimal, the only mode where cells are selectable', () => {
    const result = parseSheetUrl(docUrl())

    expect(result).toEqual({
      isValid: true,
      sheetId: FILE_ID,
      isPublished: false,
      embedUrl: `https://docs.google.com/spreadsheets/d/${FILE_ID}/edit?rm=minimal&widget=true&headers=false`,
      originalUrl: docUrl(),
    })
  })

  it('view mode drops Google chrome for a flat /preview table', () => {
    expect(parseSheetUrl(docUrl(), 'view').embedUrl)
      .toBe(`https://docs.google.com/spreadsheets/d/${FILE_ID}/preview`)
  })

  it('accepts the URL forms a user can paste from the address bar', () => {
    for (const suffix of ['/edit', '/edit#gid=123', '/view', '/', '', '?usp=sharing']) {
      const result = parseSheetUrl(docUrl(suffix))
      expect({ suffix, id: result.sheetId }).toEqual({ suffix, id: FILE_ID })
    }
  })

  it('drops the query and fragment of the pasted URL rather than carrying them into the frame', () => {
    // `gid` selects a tab, but `rm=minimal` has to win the query string; a
    // merged one is how the embed silently loses its minimal chrome.
    expect(parseSheetUrl(docUrl('/edit?gid=99#gid=99')).embedUrl)
      .toBe(`https://docs.google.com/spreadsheets/d/${FILE_ID}/edit?rm=minimal&widget=true&headers=false`)
  })
})

describe('parseSheetUrl — published URL', () => {
  it('keeps the published id, which is not the file id', () => {
    const result = parseSheetUrl(publishedUrl())

    expect(result).toEqual({
      isValid: true,
      sheetId: PUBLISHED_ID,
      isPublished: true,
      embedUrl: `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_ID}/pubhtml?widget=true&headers=false`,
      originalUrl: publishedUrl(),
    })
  })

  it('ignores the mode — /pubhtml is the only form Google serves for it', () => {
    expect(parseSheetUrl(publishedUrl(), 'view').embedUrl)
      .toBe(parseSheetUrl(publishedUrl(), 'interactive').embedUrl)
  })

  it('accepts the /pub variant Google hands out for non-HTML output', () => {
    expect(parseSheetUrl(publishedUrl('/pub?output=csv')).sheetId).toBe(PUBLISHED_ID)
  })

  it('never captures the literal "e" as a file id', () => {
    // Without the negative lookahead this parses as file id "e" and frames a
    // sheet that does not exist — valid-looking output, blank iframe.
    for (const url of [publishedUrl(), publishedUrl('/pub?output=csv')]) {
      expect(parseSheetUrl(url).sheetId).not.toBe('e')
    }
  })
})

describe('parseSheetUrl — rejections', () => {
  it('rejects an empty URL', () => {
    expect(parseSheetUrl('  ')).toMatchObject({ isValid: false, embedUrl: null, error: 'URL is required' })
  })

  it('rejects other Google products and look-alike hosts', () => {
    const rejected = [
      'https://docs.google.com/document/d/abc123/edit',
      'https://lookerstudio.google.com/reporting/abc-123',
      'https://docs.google.com.evil.test/spreadsheets/d/abc123/edit',
      'http://docs.google.com/spreadsheets/d/abc123/edit', // http, not https
      'https://docs.google.com/spreadsheets/',
      'not a url',
    ]

    for (const url of rejected) {
      expect({ url, valid: parseSheetUrl(url).isValid }).toEqual({ url, valid: false })
    }
  })

  it('carries an error message on rejection, never a half-built embed URL', () => {
    const result = parseSheetUrl('https://example.com/spreadsheets/d/abc/edit')

    expect(result.embedUrl).toBeNull()
    expect(result.sheetId).toBeNull()
    expect(result.error).toContain('docs.google.com/spreadsheets')
  })
})

describe('sheetProbeUrl', () => {
  it('probes CSV export for a document URL — 401 before link sharing, 200 after (S1.10)', () => {
    expect(sheetProbeUrl(docUrl()))
      .toBe(`https://docs.google.com/spreadsheets/d/${FILE_ID}/export?format=csv`)
  })

  it('probes /pub?output=csv for a published URL, which has no /export', () => {
    expect(sheetProbeUrl(publishedUrl()))
      .toBe(`https://docs.google.com/spreadsheets/d/e/${PUBLISHED_ID}/pub?output=csv`)
  })

  it('returns null for a URL that does not parse — never probe an unvalidated host', () => {
    expect(sheetProbeUrl('https://docs.google.com.evil.test/spreadsheets/d/abc/edit')).toBeNull()
    expect(sheetProbeUrl('')).toBeNull()
  })

  it('always builds the probe on docs.google.com, whatever came in', () => {
    for (const url of [docUrl(), publishedUrl(), docUrl('/edit?usp=sharing')]) {
      expect(new URL(sheetProbeUrl(url)!).origin).toBe('https://docs.google.com')
    }
  })
})

describe('helpers', () => {
  it('toSheetEmbedUrl returns the embed URL, or null', () => {
    expect(toSheetEmbedUrl(docUrl(), 'view')).toBe(`https://docs.google.com/spreadsheets/d/${FILE_ID}/preview`)
    expect(toSheetEmbedUrl('nope')).toBeNull()
  })

  it('extractSheetId returns the id, or null', () => {
    expect(extractSheetId(docUrl())).toBe(FILE_ID)
    expect(extractSheetId('nope')).toBeNull()
  })

  it('isValidSheetUrl checks the format only — it says nothing about sharing', () => {
    expect(isValidSheetUrl(docUrl())).toBe(true)
    expect(isValidSheetUrl(publishedUrl())).toBe(true)
    expect(isValidSheetUrl('nope')).toBe(false)
  })

  it('trims surrounding whitespace from a pasted URL', () => {
    expect(isValidSheetUrl(`  ${docUrl()}\n`)).toBe(true)
  })
})
