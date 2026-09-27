/**
 * The entry stylesheet must never sit in a dynamic import's deps list.
 *
 * Vite writes CSS names into `__vite__mapDeps` after hashing the chunk, so a
 * CSS-only change renames entry.*.css while the chunk keeps its name. A browser
 * holding that chunk as `immutable` then re-injected an old entry.*.css after
 * the current one, and the old global button rule won (2026-09-27).
 *
 * @see nuxt.config.ts — streamhub:drop-entry-css-from-deps
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { dropEntryCssFromDeps } from '../../scripts/build/entryCssDeps'

const chunk = (deps: string) =>
  `const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=[${deps}])))=>i.map(i=>d[i]);import("./A.js"),__vite__mapDeps([0,1,2,3])`

describe('dropEntryCssFromDeps', () => {
  it('puts the chunk itself in the entry stylesheet slot', () => {
    const out = dropEntryCssFromDeps(chunk('"./A.js","./B.js","./entry.B0z_f-dz.css","./C.js"'), '_nuxt/zjxOpcSc.js')
    expect(out).toContain('m.f=["./A.js","./B.js","./zjxOpcSc.js","./C.js"]')
    expect(out).not.toMatch(/entry\.[\w-]+\.css/)
  })

  it('keeps every index pointing at the same file', () => {
    const out = dropEntryCssFromDeps(chunk('"./A.js","./entry.x.css","./B.js"'), '_nuxt/Self.js')
    const list = out.match(/m\.f=\[([^\]]*)\]/)![1]!.split(',')
    expect(list).toHaveLength(3)
    expect(list[0]).toBe('"./A.js"')
    expect(list[2]).toBe('"./B.js"')
  })

  it('leaves component stylesheets alone', () => {
    const code = chunk('"./A.js","./SegmentedControl.BYieWBJg.css"')
    expect(dropEntryCssFromDeps(code, '_nuxt/X.js')).toBe(code)
  })

  it('leaves chunks without a deps list alone', () => {
    const code = 'import{a}from"./entry.B0z_f-dz.css"'
    expect(dropEntryCssFromDeps(code, '_nuxt/X.js')).toBe(code)
  })
})

describe('nuxt.config.ts wiring', () => {
  const config = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8')

  it('runs the rewrite after Vite fills the lists', () => {
    // Without order: 'post' the hook runs before Vite's own generateBundle
    // writes __vite__mapDeps and silently changes nothing.
    expect(config).toContain('streamhub:drop-entry-css-from-deps')
    expect(config).toMatch(/generateBundle:\s*\{[\s\S]*?order:\s*'post'/)
    expect(config).toContain('dropEntryCssFromDeps(')
  })
})
