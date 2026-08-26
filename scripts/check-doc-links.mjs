#!/usr/bin/env node
/**
 * Read-only link checker for the Markdown docs.
 *
 * Catches the two failure modes this repo actually produces:
 *   1. a relative path that points at nothing (`../../GUIDES/x.md` from `docs/GUIDES/`
 *      escapes the repo — the section index that never existed)
 *   2. a `#anchor` into a .md file whose heading was renamed or removed
 *
 * Fragments on non-Markdown targets (`app/x.vue#L120`) are line references, not
 * anchors, so only the file is checked.
 *
 * Usage:
 *   node scripts/check-doc-links.mjs            # files + anchors
 *   node scripts/check-doc-links.mjs --no-anchors
 *   node scripts/check-doc-links.mjs --json
 *
 * Exit 1 when anything is broken. Baseline is 0.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const CHECK_ANCHORS = !args.includes('--no-anchors')
const AS_JSON = args.includes('--json')

/** Vendored skill packages — not ours to fix. */
const EXCLUDE = [/^\.claude\/skills\//]

function trackedMarkdown() {
  const out = execFileSync('git', ['ls-files', '*.md'], { cwd: ROOT, encoding: 'utf8' })
  return out.split('\n').filter(Boolean).filter((f) => !EXCLUDE.some((re) => re.test(f)))
}

/** Blank out fenced code so ASCII trees and sample links are not parsed as links. */
function stripFences(text) {
  let inFence = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence
        return ''
      }
      return inFence ? '' : line
    })
    .join('\n')
}

/**
 * GitHub heading slug: drop everything that is not a letter, number, space,
 * hyphen or underscore (emoji included), lowercase, spaces to hyphens, then
 * `-1`, `-2`… for repeats. Leading hyphens are kept — that is why an emoji
 * heading anchors as `#-tag-permissions`.
 */
function slug(heading, seen) {
  const base = heading
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
  const n = seen.get(base) ?? 0
  seen.set(base, n + 1)
  return n === 0 ? base : `${base}-${n}`
}

function anchorsOf(absPath) {
  const body = stripFences(readFileSync(absPath, 'utf8'))
  const seen = new Map()
  const found = new Set()
  for (const line of body.split('\n')) {
    const h = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)
    if (h) found.add(slug(h[1], seen))
    for (const m of line.matchAll(/<a\s+(?:name|id)=["']([^"']+)["']/gi)) found.add(m[1].toLowerCase())
  }
  return found
}

const anchorCache = new Map()
function hasAnchor(absPath, anchor) {
  if (!anchorCache.has(absPath)) anchorCache.set(absPath, anchorsOf(absPath))
  return anchorCache.get(absPath).has(decodeURIComponent(anchor).toLowerCase())
}

/** Inline `](target)` plus reference definitions `[label]: target`. */
function linksIn(file) {
  const body = stripFences(readFileSync(join(ROOT, file), 'utf8'))
  const links = []
  body.split('\n').forEach((line, i) => {
    const push = (raw) => links.push({ line: i + 1, raw: raw.trim() })
    for (const m of line.matchAll(/\]\(\s*(<[^>]*>|[^()\s]*(?:\([^()]*\)[^()\s]*)*)\s*(?:"[^"]*")?\)/g)) push(m[1])
    const def = /^\s*\[[^\]]+\]:\s+(\S+)/.exec(line)
    if (def) push(def[1])
  })
  return links
}

const problems = []
for (const file of trackedMarkdown()) {
  const dir = dirname(join(ROOT, file))
  for (const { line, raw } of linksIn(file)) {
    const target = raw.replace(/^<|>$/g, '')
    if (!target || /^(https?:|mailto:|tel:|data:|#)/i.test(target)) continue

    const hash = target.indexOf('#')
    const pathPart = hash === -1 ? target : target.slice(0, hash)
    const anchor = hash === -1 ? '' : target.slice(hash + 1)
    if (!pathPart) continue

    const abs = resolve(dir, decodeURIComponent(pathPart))
    const inRepo = !relative(ROOT, abs).startsWith('..')
    if (!existsSync(abs) || !inRepo) {
      problems.push({
        file,
        line,
        target,
        kind: 'missing-file',
        detail: inRepo ? 'no such file' : `escapes the repo (resolves to ${normalize(abs)})`,
      })
      continue
    }
    if (CHECK_ANCHORS && anchor && abs.endsWith('.md') && !hasAnchor(abs, anchor)) {
      problems.push({ file, line, target, kind: 'missing-anchor', detail: `no heading anchors to #${anchor}` })
    }
  }
}

if (AS_JSON) {
  console.log(JSON.stringify(problems, null, 2))
} else if (problems.length === 0) {
  console.log('✅ doc links OK — 0 broken')
} else {
  for (const p of problems) console.log(`${p.file}:${p.line}  ${p.target}\n    ${p.kind}: ${p.detail}`)
  const files = new Set(problems.map((p) => p.file)).size
  console.log(`\n❌ ${problems.length} broken link(s) in ${files} file(s)`)
}
process.exit(problems.length === 0 ? 0 : 1)
