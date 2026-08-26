---
title: Tech Stack Details
---

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

> **`tailwind.config.ts` at the repo root is dead.** Tailwind 4 only reads a JS/TS config when
> a stylesheet points at one with `@config`, and nothing does. Its palette, spacing and shadow
> scales have no effect — no `primary-500`-style class appears anywhere in `app/`. Real theming
> lives in the CSS variables in `assets/css/theme.css`; see
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
| `@types/node` | ^25.2.0 | |

There is no `.nvmrc`, and the two Node versions in play do not match: the deployed function
runs **nodejs22** ([firebase.json](../../firebase.json)) while CI builds it on **Node 24**
([.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) line 28). Nothing has
broken on that gap so far, but it is a gap, not a decision anyone recorded.

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
