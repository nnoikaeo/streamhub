import { describe, it, expect } from 'vitest'
import { entryScriptFromHtml, isNewBuild } from '../../app/utils/buildId'

describe('entryScriptFromHtml', () => {
  it('reads the entry script from the SPA index', () => {
    // Shape served by prod on 2026-09-28 (scripts/generate-spa-index.mjs)
    const html = '<head><link rel="stylesheet" href="/_nuxt/entry.B0z_f-dz.css"><script type="module" src="/_nuxt/DYiEDWHq.js" crossorigin></script></head>'
    expect(entryScriptFromHtml(html)).toBe('/_nuxt/DYiEDWHq.js')
  })

  it('accepts a leading dash in the hash', () => {
    expect(entryScriptFromHtml('<script type="module" src="/_nuxt/-jpfaB6W.js"></script>')).toBe('/_nuxt/-jpfaB6W.js')
  })

  it('ignores non-module and foreign scripts', () => {
    expect(entryScriptFromHtml('<script src="/_nuxt/A.js"></script><script type="module" src="https://cdn.x/y.js"></script>')).toBeNull()
  })

  it('returns null for an error page', () => {
    expect(entryScriptFromHtml('<html><body>503</body></html>')).toBeNull()
  })
})

describe('isNewBuild', () => {
  it('is true only when both sides are known and differ', () => {
    expect(isNewBuild('/_nuxt/A.js', '/_nuxt/B.js')).toBe(true)
    expect(isNewBuild('/_nuxt/A.js', '/_nuxt/A.js')).toBe(false)
  })

  it('treats an unknown side as no update', () => {
    expect(isNewBuild(null, '/_nuxt/B.js')).toBe(false)
    expect(isNewBuild('/_nuxt/A.js', null)).toBe(false)
  })
})
