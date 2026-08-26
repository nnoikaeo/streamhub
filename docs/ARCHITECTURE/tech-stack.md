# Tech Stack Details

Versions below are the ranges in [package.json](../../package.json) and the resolved versions
in the lockfile at the time of writing. `npm ls <pkg>` is the authority, not this page.

## Frontend

| Package | Version | Notes |
|---|---|---|
| `nuxt` | ^4.2.2 | **Nuxt 4**, `ssr: false` — an SPA, not a server-rendered app |
| `vue` | ^3.5.27 | Composition API throughout |
| `typescript` | ^5.9.3 | Typecheck with `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` — there is no `type-check` script, and the root `tsconfig.json` is `"files": []` and checks nothing |
| `tailwindcss` | ^4.2.1 | **Tailwind 4**, CSS-first. `assets/css/main.css` starts with `@import "tailwindcss"` |
| `@tailwindcss/postcss` | ^4.2.1 | The v4 PostCSS plugin, wired in `postcss.config.ts` |
| `@nuxt/ui` | ^4.3.0 | Component library |
| `@nuxt/image` | ^2.0.0 | Image optimization |
| `@vueuse/core` | ^14.1.0 | Composition utilities |
| `vee-validate` + `@vee-validate/zod` | ^4.15.1 | Form validation |
| `zod` | ^3.24.0 | Schemas, shared with server routes |

> **There is no `tailwind.config.ts`.** Tailwind 4 reads a JS/TS config only when a stylesheet
> points at one with `@config`, and none does. A leftover v3 config file sat in the repo root
> until it was deleted after two builds proved the CSS output byte-identical with and without
> it. Theming lives in the CSS variables in `assets/css/theme.css`; see
> [DESIGN_SYSTEM.md](../DESIGN/DESIGN_SYSTEM.md).

## State

`pinia` ^3.0.4 with `@pinia/nuxt` ^0.11.3. Four stores in `app/stores/`: `auth`, `dashboard`,
`permissions`, `tags`. API in [PERMISSIONS_STORE.md](../GUIDES/PERMISSIONS_STORE.md).

## Firebase

| Package | Version | Used for |
|---|---|---|
| `firebase` | ^12.8.0 | Client SDK — Auth and Firestore, called from `app/composables/useFirestoreService.ts` |
| `firebase-admin` | ^13.7.0 | Server SDK inside `/api/**` routes |

Auth is Google OAuth via `signInWithPopup()` in `app/composables/useAuth.ts`, with
`browserLocalPersistence` so a session survives a refresh. Popup — not redirect — which is why
`auth/popup-blocked` is a real failure mode; see [authentication.md](../GUIDES/authentication.md).

Firestore is read with one-shot queries. **No `onSnapshot` listener exists in this codebase.**
Collections are documented in [database-schema.md](../GUIDES/database-schema.md).

Cloud Storage is initialized in `app/plugins/firebase.ts` and never used; there is no
`storage.rules`.

## Server & external services

| Package | Version | Used for |
|---|---|---|
| `nitropack` | 2.13.1 (via Nuxt) | `firebase` preset, one Cloud Function named `server`, runtime **nodejs22** |
| `resend` | ^6.9.4 | Invitation email. `RESEND_API_KEY` comes from Secret Manager |
| `googleapis` | ^171.4.0 | Looker Studio API through a service account |

`sharp` arrives as a transitive dependency of the image handling and is the reason functions
are **never** built locally on a Mac — the binary is the wrong architecture for the Linux
runtime. Let CI build them.

## Build & tooling

| Package | Version | Notes |
|---|---|---|
| `vite` | 7.3.1 (via Nuxt) | Dev server and bundler |
| `vitest` | ^4.1.2 | 335 tests, `npm test`. Anything added to `shared/utils/` must also be registered in `tests/setup.ts` — plain Vitest does not run Nuxt auto-imports |
| `eslint` + `@nuxt/eslint` | ^9.39.2 / ^1.12.1 | `npx eslint .`, config in [eslint.config.mjs](../../eslint.config.mjs) |
| `tsx` | ^4.21.0 | Runs the `.ts` maintenance scripts in `scripts/` |
| `@types/node` | ^22.20.1 | Pinned to the **runtime major**. On `^25` the typings described APIs Node 22 does not have, so `vue-tsc` would have accepted code that fails in the deployed function |

**Node 22 everywhere.** Three places say so and all three must agree — CI once built on Node 24
against a nodejs22 runtime, which happened not to break but was nobody's decision:

| Where | Value |
|---|---|
| [.nvmrc](../../.nvmrc) | `22` — local via `nvm use`, and every workflow reads it with `node-version-file: .nvmrc` rather than pinning its own number |
| [nuxt.config.ts](../../nuxt.config.ts) → `nitro.firebase.nodeVersion` | `'22'` — what Nitro targets and writes into the function config |
| [firebase.json](../../firebase.json) → `functions[].runtime` | `nodejs22` — what Cloud Functions actually runs |

Changing the runtime means editing `.nvmrc`, `nitro.firebase.nodeVersion` and `firebase.json` together.

## Major versions deliberately not taken

These have a newer major available. Each is left where it is for a stated reason, so nobody has
to re-derive it:

| Package | On | Latest | Why not yet |
|---|---|---|---|
| `nuxt` | 4.2.2 | 4.4.5 | In-range, but it moves Nitro and the Firebase preset. Deploy is the one thing here with no staging — worth its own PR with a real deploy behind it |
| `@nuxt/ui` | 4.3.0 | 4.11.0 | Eight minors of a component library. 335 unit tests do not see visual or interaction regressions; needs a human pass over the admin tables and modals |
| `@nuxt/image` | 2.0.0 | 2.1.0 | 2.1.0 depends on `ipx@4.0.0-beta.1`. A prerelease in the production tree needs a decision, not a version bump |
| `tailwindcss` | 4.2.1 | 4.3.3 | Preflight changes have bitten before (PR #451). Bump it with the UI pass, not separately |
| `firebase-admin` | 13.10.0 | 14.3.0 | Major. Closes the nine remaining moderate advisories in the google-cloud chain — the strongest candidate to do next |
| `pinia` / `@pinia/nuxt` | 3.0.4 / 0.11.3 | 4.0.3 / 1.0.2 | Store API major across four stores |
| `eslint` | 9.39.5 | 10.9.1 | New majors add rules; expect a non-zero baseline to work through |
| `typescript` | 5.9.3 | 7.0.2 | Two majors; `vue-tsc` has to support it first |
| `vue-router` | 4.6.4 | 5.2.0 | Major, and route matching is load-bearing for the `[[folderId]]` pages |
| `zod` | 3.25.76 | 4.4.3 | Major; schemas are shared between client forms and server routes |
| `googleapis` | 171.4.0 | 176.0.0 | Five majors of a generated client. Only the Looker Studio surface is used |
| `@types/node` | 22.20.1 | 26.3.0 | **Pinned on purpose** to the nodejs22 runtime — see above |

## Security overrides in package.json

`overrides` pins seven transitive packages to their first patched release. Each one was a
**critical or high** advisory that reached the deployed Cloud Function, and each was stuck
below the fix by a range in a dependency we do not control.

| Pinned | From | Advisory |
|---|---|---|
| `protobufjs` ^7.6.5 | 7.5.4 | **critical** — arbitrary code execution |
| `@grpc/grpc-js` ^1.9.16 | 1.9.15 | high — malformed request crashes the server |
| `node-forge` ^1.4.0 | 1.3.3 | high — certificate chain bypass, Ed25519 signature forgery |
| `h3` ^1.15.11 | 1.15.5 | high — path traversal, arbitrary file read in `serveStatic` |
| `sharp` ^0.35.4 | 0.34.5 | high — four libvips CVEs |
| `svgo` ^4.1.0 | 4.0.0 | high — billion-laughs DoS |
| `defu` ^6.1.7 | 6.1.4 | high — prototype pollution via `__proto__` |

**Do not delete these without re-running `npm audit --omit=dev`.** They are not preferences.
Removing one silently reopens the advisory, because the parent's range still allows the
vulnerable version.

Drop an override once the parent package's own range has moved past it — check with
`npm ls <package>` that the pin is no longer doing any work.

The overrides route was chosen over `npm audit fix`, which resolves the same advisories by
dragging Nuxt from 4.2.2 to 4.5.2 and `ipx` to a **beta**, in a 20,000-line lockfile diff. A
framework upgrade is a change worth making deliberately, not as a side effect of a security
patch.

## package-lock.json

The lock had drifted from `package.json`: 56 entries for `firebase-functions@7.2.2` and the
`express` tree it pulled, left behind when firebase-functions stopped being a devDependency.
Nothing declared them, `npm ci` installed them on every CI run, and no code imported them.
Pruned by regenerating with `npm install --package-lock-only`.

The deployed function is unaffected either way: Nitro writes its own
`.output/server/package.json` (which declares `firebase-functions` itself), and CI installs
that separately. The repo lock never reaches Cloud Functions.

**Regenerate the lock with the npm that CI runs, not yours.** Node 22 ships npm 10, and npm 11
resolves one entry differently: it drops `@nuxt/test-utils/node_modules/crossws`, which npm 10
requires, and `npm ci` then fails with `Missing: crossws@0.4.12 from lock file`. Both majors
agree about everything else. So:

```bash
npx --yes npm@10.9.8 install --package-lock-only --ignore-scripts
```

A lock written by npm 10 installs cleanly under both; one written by npm 11 breaks CI. If
`npm install` rewrites the lock when you changed nothing in `package.json`, commit the
regenerated file on its own rather than letting it ride along in an unrelated diff.

## Verification baselines

Each of these is **0** on a clean tree. A non-zero count is something you introduced.

| Command | Baseline |
|---|---|
| `npx eslint .` | 0 |
| `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | 0 |
| `npx vue-tsc --noEmit -p tests/tsconfig.json` | 0 |
| `npx vue-tsc --noEmit -p scripts/tsconfig.json` | 0 |
| `npm run docs:links` | 0 |
| `npm test` | 335 passing |

## See also

- [Architecture Overview](overview.md)
- [Environment Variables](../REFERENCE/environment-variables.md)
- [Deployment](../OPERATIONS/deployment.md)
