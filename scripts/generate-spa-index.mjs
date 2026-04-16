/**
 * generate-spa-index.mjs
 *
 * Generates .output/public/index.html from the Vite precomputed manifest after
 * `npm run build` completes. This replaces `nitro.prerender.routes: ['/']` which
 * hangs in GitHub Actions because firebase-functions/v2 is imported at module
 * level in the Nitro server bundle, and the GCP metadata endpoint
 * (169.254.169.254) is served by Azure IMDS in GitHub Actions runners —
 * causing a multi-minute hang before SDK timeout.
 *
 * This script imports ONLY client.precomputed.mjs (no firebase deps) and uses
 * a static HTML template to produce the same shell that Nitro prerender would.
 *
 * Usage: node scripts/generate-spa-index.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const precomputedPath = resolve(root, '.output/server/chunks/build/client.precomputed.mjs')
const outputPath = resolve(root, '.output/public/index.html')

if (!existsSync(precomputedPath)) {
  console.error('❌ .output/server/chunks/build/client.precomputed.mjs not found.')
  console.error('   Run `npm run build` first.')
  process.exit(1)
}

// Import precomputed manifest — pure data, no network or firebase deps
const mod = await import(precomputedPath)
const precomputed = typeof mod.default === 'function' ? mod.default() : mod.default

// ── Extract entry JS + CSS ────────────────────────────────────────────────────
let entryJS = null
let entryCSS = null

for (const dep of Object.values(precomputed.dependencies || {})) {
  for (const meta of Object.values(dep.scripts || {})) {
    if (meta.isEntry && meta.file && !meta.file.includes('@vite')) {
      entryJS = meta.file
      if (meta.css?.length) {
        entryCSS = meta.css[0]
      }
    }
  }
}

if (!entryJS) {
  console.error('❌ Could not find entry JS in client.precomputed.mjs')
  process.exit(1)
}

console.log(`📦 Entry JS  : /_nuxt/${entryJS}`)
console.log(`🎨 Entry CSS : ${entryCSS ? `/_nuxt/${entryCSS}` : '(none)'}`)

// ── Read runtime config from env (same values baked in at build time) ─────────
const publicConfig = {
  useFirestore: process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true',
  useJsonMock: process.env.NUXT_PUBLIC_USE_JSON_MOCK !== 'false',
  firebase: {
    apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
      ? Number(process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
      : 0,
    appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
  },
}

// buildId matches what Nuxt embeds — just use a stable value based on entry hash
const buildId = entryJS.replace('.js', '')

const nuxtConfig = {
  public: publicConfig,
  app: {
    baseURL: '/',
    buildId,
    buildAssetsDir: '/_nuxt/',
    cdnURL: '',
  },
}

// ── Build HTML ────────────────────────────────────────────────────────────────
const cssTag = entryCSS
  ? `<link rel="stylesheet" href="/_nuxt/${entryCSS}" crossorigin>`
  : ''

// Color-mode inline script (matches @nuxtjs/color-mode default output)
const colorModeScript = `"use strict";(()=>{const t=window,e=document.documentElement,c=["dark","light"],n=getStorageValue("localStorage","nuxt-color-mode")||"system";let i=n==="system"?u():n;const r=e.getAttribute("data-color-mode-forced");r&&(i=r),l(i),t["__NUXT_COLOR_MODE__"]={preference:n,value:i,getColorScheme:u,addColorScheme:l,removeColorScheme:d};function l(o){const s=""+o+"",a="";e.classList?e.classList.add(s):e.className+=" "+s,a&&e.setAttribute("data-"+a,o)}function d(o){const s=""+o+"",a="";e.classList?e.classList.remove(s):e.className=e.className.replace(new RegExp(s,"g"),""),a&&e.removeAttribute("data-"+a)}function f(o){return t.matchMedia("(prefers-color-scheme"+o+")")}function u(){if(t.matchMedia&&f("").media!=="not all"){for(const o of c)if(f(":"+o).matches)return o}return"light"}})();function getStorageValue(t,e){switch(t){case"localStorage":return window.localStorage.getItem(e);case"sessionStorage":return window.sessionStorage.getItem(e);case"cookie":return getCookie(e);default:return null}}function getCookie(t){const c=("; "+window.document.cookie).split("; "+t+"=");if(c.length===2)return c.pop()?.split(";").shift()}`

const nuxtDataPayload = JSON.stringify([
  { prerenderedAt: 1, serverRendered: 2 },
  Date.now(),
  false,
])

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script type="importmap">{"imports":{"#entry":"/_nuxt/${entryJS}"}}<\/script>${cssTag}<link rel="modulepreload" as="script" crossorigin href="/_nuxt/${entryJS}"><script type="module" src="/_nuxt/${entryJS}" crossorigin><\/script><script>${colorModeScript}<\/script></head><body><div id="__nuxt" class="isolate"></div><div id="teleports"></div><script>window.__NUXT__={};window.__NUXT__.config=${JSON.stringify(nuxtConfig)}<\/script><script type="application/json" data-nuxt-data="nuxt-app" data-ssr="false" id="__NUXT_DATA__">${nuxtDataPayload}<\/script></body></html>`

writeFileSync(outputPath, html)
console.log(`✅ Written: .output/public/index.html (${html.length} bytes)`)
