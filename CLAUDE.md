# Streamhub — Claude Instructions

Nuxt 3 SPA deployed on Firebase Hosting + Cloud Functions (Nitro). Firestore as the database.

---

## Critical Rules (read before acting)

### Git & Branching
- **Always branch from `develop`**, not `main`
- Flow: `develop` → `feat/xxx` or `fix/xxx` → PR to `develop` → merge to `main`
- Never push directly to `main` — only via back-merge from `develop`
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.)
- See full workflow: [docs/CONTRIBUTING/workflow.md](docs/CONTRIBUTING/workflow.md)

### Deploy
- **Push to `main` deploys BOTH hosting and functions** via GitHub Actions (`--only hosting,functions --force`)
- **Hosting from local**: `bash scripts/deploy-hosting.sh` — never run build + deploy manually without env vars. Running it after a back-merge is normal practice, not a sign CI failed: CI's last "Verify deployment" step sleeps only 10s before comparing the live entry chunk, so it often goes red on edge propagation while the deploy itself succeeded
- **Functions from local**: never — a mac-built `sharp` is the wrong arch for the linux runtime; let CI build them
- **Firestore rules**: must deploy manually — `firebase deploy --only firestore:rules --project streamhub-1c27a` — CI service account lacks permission
- Never run `node scripts/generate-spa-index.mjs` directly without env vars (produces blank Firebase config → login broken)
- See: [docs/OPERATIONS/deployment.md](docs/OPERATIONS/deployment.md)

### Error Handling & `any`
- Caught values are `unknown`. Use the helpers in `shared/utils/errors.ts` (`getErrorStatus`, `getErrorMessage`, `getErrorDataMessage`, `getErrorCode`, `toError`) — auto-imported into **both** `app/` and `server/`. Never `catch (e: any)`
- Anything new in `shared/utils/` must also be registered as a global in `tests/setup.ts` — plain Vitest does not run Nuxt auto-import
- Generic constraints: `T extends object`, **not** `Record<string, unknown>` (interfaces have no index signature, so it rejects `User`, `Dashboard`, …)
- Always pass the type argument to `readJSON<T>` / `findById<T>` / `updateItem<T>`. Leaving it bare falls back to the constraint and invites an `as any[]` cast — that is how the `?company=` filter bug survived (PR #359)
- Never "fix" an `any` with `as any` or `@ts-ignore`. If the real type is unclear, skip the site and say why
- See: [docs/CONTRIBUTING/coding-standards.md](docs/CONTRIBUTING/coding-standards.md) § Error Handling, § Avoiding `any`

### Firestore / Nitro Plugins
- Never `throw` inside Nitro plugins (`server/plugins/`) — Firebase CLI runs them during deploy analysis without env vars
- Guard Firestore access with `if (!db) return` pattern before any query

---

## Document Index

### Architecture
| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE/overview.md](docs/ARCHITECTURE/overview.md) | System overview, component map |
| [docs/ARCHITECTURE/tech-stack.md](docs/ARCHITECTURE/tech-stack.md) | Nuxt 3, Firebase, Pinia, Tailwind versions |
| [docs/ARCHITECTURE/folder-structure.md](docs/ARCHITECTURE/folder-structure.md) | Directory layout and conventions |
| [docs/ARCHITECTURE/data-flow.md](docs/ARCHITECTURE/data-flow.md) | Client ↔ Firestore ↔ Functions data flow |

### Guides
| Doc | Contents |
|-----|----------|
| [docs/GUIDES/roles-and-permissions.md](docs/GUIDES/roles-and-permissions.md) | admin / moderator / user role matrix |
| [docs/GUIDES/authentication.md](docs/GUIDES/authentication.md) | Firebase Auth, redirect flow, authDomain caveat |
| [docs/GUIDES/database-schema.md](docs/GUIDES/database-schema.md) | Firestore collection schemas |
| [docs/GUIDES/company-management.md](docs/GUIDES/company-management.md) | Multi-company isolation pattern |
| [docs/GUIDES/PERMISSIONS_STORE.md](docs/GUIDES/PERMISSIONS_STORE.md) | Pinia permissions store API |

### Contributing
| Doc | Contents |
|-----|----------|
| [docs/CONTRIBUTING/workflow.md](docs/CONTRIBUTING/workflow.md) | Full Git Flow branching steps |
| [docs/CONTRIBUTING/coding-standards.md](docs/CONTRIBUTING/coding-standards.md) | Vue/TS style rules, naming conventions |
| [docs/CONTRIBUTING/code-review.md](docs/CONTRIBUTING/code-review.md) | PR review checklist |
| [docs/CONTRIBUTING/prompt-playbook.md](docs/CONTRIBUTING/prompt-playbook.md) | How to prompt Claude effectively for this repo |

### Operations
| Doc | Contents |
|-----|----------|
| [docs/OPERATIONS/deployment.md](docs/OPERATIONS/deployment.md) | Deploy procedures, CI/CD, rollback |
| [docs/OPERATIONS/pre-launch-checklist.md](docs/OPERATIONS/pre-launch-checklist.md) | A–E test groups, launch sign-off |
| [docs/OPERATIONS/roadmap.md](docs/OPERATIONS/roadmap.md) | Feature roadmap and priorities |
| [docs/OPERATIONS/versioning.md](docs/OPERATIONS/versioning.md) | Version numbering policy |
| [docs/OPERATIONS/manual-test-plan.md](docs/OPERATIONS/manual-test-plan.md) | Manual QA test cases by role |

### Reference
| Doc | Contents |
|-----|----------|
| [docs/REFERENCE/environment-variables.md](docs/REFERENCE/environment-variables.md) | All env vars and where they're set |
| [firestore.rules](firestore.rules) | Security rules (admin / moderator / user) |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Production CI/CD pipeline |
| [.github/workflows/preview.yml](.github/workflows/preview.yml) | PR preview deploy pipeline |

### Troubleshooting
| Doc | Contents |
|-----|----------|
| [docs/TROUBLESHOOTING/common-issues.md](docs/TROUBLESHOOTING/common-issues.md) | Known issues and fixes |
| [docs/TROUBLESHOOTING/faq.md](docs/TROUBLESHOOTING/faq.md) | Frequently asked questions |

### Design
| Doc | Contents |
|-----|----------|
| [docs/DESIGN/DESIGN_SYSTEM.md](docs/DESIGN/DESIGN_SYSTEM.md) | Color tokens, typography, component patterns |
| [docs/DESIGN/COMPONENT_ARCHITECTURE.md](docs/DESIGN/COMPONENT_ARCHITECTURE.md) | Component hierarchy and responsibilities |
| [docs/DESIGN/user-flows.md](docs/DESIGN/user-flows.md) | User journey maps by role |
| [docs/DESIGN/wireframes/](docs/DESIGN/wireframes/) | Page-level wireframes |

### Getting Started
| Doc | Contents |
|-----|----------|
| [docs/GETTING-STARTED/installation.md](docs/GETTING-STARTED/installation.md) | Local dev setup |
| [docs/GETTING-STARTED/setup-firebase.md](docs/GETTING-STARTED/setup-firebase.md) | Firebase project configuration |
| [docs/GETTING-STARTED/first-deployment.md](docs/GETTING-STARTED/first-deployment.md) | First deploy walkthrough |

---

## Key Scripts

| Script | Purpose |
|--------|---------|
| `bash scripts/deploy-hosting.sh` | Build + deploy Hosting only (safe, loads .env.local) |
| `firebase deploy --only firestore:rules --project streamhub-1c27a` | Deploy Firestore security rules |
| `npm run audit:orphans` | Read-only Firestore data-hygiene check (dangling folderId / group / region / company / member refs) |
| `npm run cloudbuild:status` | Read-only Cloud Build history for the functions deploy — tells queue expiry (`EXPIRED`, queued ~600s, ran 0s → Google-side, just rerun) apart from a real build failure. Pass a build id for details |
| `node scripts/migrate-company-code.mjs OLD NEW [--apply]` | Rename a company `code` (= its Firestore doc id, which the UI locks). Dry run without `--apply`. Copies the doc, repoints `users.company`, deletes the old one — one atomic batch |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest suite. **Baseline is 220 passing** |
| `npx eslint .` | Lint check (no `lint` npm script exists). 57 pre-existing problems, **all `@typescript-eslint/no-explicit-any`**: compare the count before/after |
| `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | Typecheck — **never** `-p tsconfig.json` (root is `"files": []`, checks nothing, false pass). **Baseline is 0 — any error is yours** |
| `npx vue-tsc --noEmit -p tests/tsconfig.json` | Typecheck `tests/` — the generated `.nuxt/tsconfig.*` projects do **not** cover it (Nuxt only looks at `tests/nuxt/**`), so test fixtures go unchecked without this. **Baseline is 0** |
