# Streamhub — Claude Instructions

Nuxt 4 SPA (`ssr: false`) deployed on Firebase Hosting + Cloud Functions (Nitro, nodejs22). Firestore as the database.

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
- Stored dates are not `Date`. `restrictions.expiry` is a Firestore `Timestamp` in prod and an ISO string in the JSON store, while the type says `Date`. Read it with `toDate` / `isExpired` from `shared/utils/dates.ts` — `new Date(timestamp)` gives `Invalid Date`, compares `false`, and grants access that should have expired (PR #364)
- Writing an expiry goes through `toExpiryTimestamps` (`app/utils/expiryWrite.ts`) so the stored shape is always a `Timestamp`, whatever the page held — the permissions page deep-clones its state through JSON, which turns a `Date` into a string before any save runs (PR #379)
- A date picked as a date-only string is read with `endOfDayLocal` (`shared/utils/dates.ts`). `new Date('2026-08-18')` is midnight **UTC** — 07:00 in Bangkok — so an expiry set "for the 18th" used to cut access that morning, 17 hours early
- Anything new in `shared/utils/` must also be registered as a global in `tests/setup.ts` — plain Vitest does not run Nuxt auto-import
- Generic constraints: `T extends object`, **not** `Record<string, unknown>` (interfaces have no index signature, so it rejects `User`, `Dashboard`, …)
- Always pass the type argument to `readJSON<T>` / `findById<T>` / `updateItem<T>`. Leaving it bare falls back to the constraint and invites an `as any[]` cast — that is how the `?company=` filter bug survived (PR #359)
- Never "fix" an `any` with `as any` or `@ts-ignore`. If the real type is unclear, skip the site and say why. Sometimes the right fix is deleting the code: two of the last three sites guarded logic that could never run (PR #366)
- The backlog is closed — `npx eslint .` is **0**. Any `any` you add is a regression the lint run catches
- See: [docs/CONTRIBUTING/coding-standards.md](docs/CONTRIBUTING/coding-standards.md) § Error Handling, § Avoiding `any`

### Firestore / Nitro Plugins
- Never `throw` inside Nitro plugins (`server/plugins/`) — Firebase CLI runs them during deploy analysis without env vars
- Guard Firestore access with `if (!db) return` pattern before any query

### Looker Embeds
- A Looker report in an iframe needs **Google's cookies**, which are third-party there. Safari blocks those by default, so a report that is shared with named accounts renders Looker's own "cannot access report" page on every Safari — desktop, iPhone, iPad, and Chrome/Firefox on iOS (all WebKit). Chrome on desktop is unaffected, which is why this hid for so long (BUG-032)
- The failure is a **cross-origin document**: no load error, no event, nothing to feature-detect. Do not try to detect it — [browser.ts](app/utils/browser.ts) sniffs WebKit and the dashboard page shows a dismissible hint up front
- **The only fix that works** is sharing the report as "anyone with the link" **and** turning on File > Embed report > Enable embedding in Looker. Those are two separate switches: link-shared without embedding enabled is a blank frame in *every* browser, which looks exactly like the cookie failure and is not
- `allow-storage-access-by-user-activation` is on every Looker iframe, but measured on prod it changes nothing — Looker never calls `requestStorageAccess()`. Keep it, don't count on it
- Sharing by link means anyone holding the Looker URL can open the report without passing StreamHub's permission checks. The URL stays sealed inside the embed token — weigh that against how sensitive the report is
- **New dashboards: require link sharing + Enable embedding before the report goes in.** Agreed 2026-08-25
- **The 30 reports already in use cannot be changed — we do not own them.** Safari users cannot open those at all; the hint bar is the permanent answer for them, not a stopgap, so do not remove it. Closing the gap for real means asking the report owners, which is a cross-team conversation and not a code change

---

## Document Index

[docs/README.md](docs/README.md) lists **every** document and is CI-checked against the tree — a doc nothing links to fails the build.
The tables below are the subset needed most often; a doc missing here is not missing from the project.
Finished implementation plans live in [docs/OPERATIONS/archive/](docs/OPERATIONS/archive/) — read them for *why*, never copy code out of them.

### Architecture
| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE/overview.md](docs/ARCHITECTURE/overview.md) | System overview, component map |
| [docs/ARCHITECTURE/tech-stack.md](docs/ARCHITECTURE/tech-stack.md) | Nuxt 4, Vue 3, Firebase, Pinia, Tailwind 4 versions — and what is installed but unused |
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
| [docs/OPERATIONS/looker-sharing-policy.md](docs/OPERATIONS/looker-sharing-policy.md) | Looker sharing policy for new dashboards, and why the 30 existing reports cannot be fixed (BUG-032) |

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
| `npm run docs:links` | Read-only Markdown check across every tracked `.md` (skips `.claude/skills/`, which is vendored). Three things: the linked file resolves; for `.md` targets the `#anchor` still matches a heading under GitHub's slug rules (trim, lowercase, *then* strip punctuation — which is why an emoji heading anchors as `#-tag-permissions`); and no doc under `docs/` is an **orphan** — a file nothing links to is how an index drifts without breaking anything. A `#L120` on a `.ts`/`.vue` target is a line ref, not an anchor, so only the file is checked. Enforced by [.github/workflows/docs.yml](.github/workflows/docs.yml) on any PR touching a `.md`. **Baseline is 0** |
| `npm run audit:orphans` | Read-only Firestore data-hygiene check (dangling folderId / group / region / company / member / **moderator** refs — the last one exposed five folders still naming a user deleted months ago) |
| `node scripts/clean-orphan-refs.mjs [--apply]` | ตัวคู่กับ audit ที่ **ล้างจริง** — ตัด id ที่ตายแล้วออกจาก `users.groups[]`, `groups.members[]`, `folders.assignedModerators[]` (3 กรณีที่ "ลบทิ้ง" คือคำตอบทั้งหมด) · ไม่แตะ `dashboards.folderId` / `folders.parentId` / `users.company` เพราะเป็น pointer เดี่ยว ต้องตัดสินใจว่าจะย้ายไปไหน ไม่ใช่ล้าง · dry run ถ้าไม่ใส่ `--apply`, เขียนเป็น batch เดียว |
| `node scripts/qa-broken-refs.mjs status\|break\|restore [--apply]` | QA fixture สำหรับ TC 6.2.1/6.2.2 — เขียน `folderId` และ `access.users` ที่ชี้ไปยัง id ที่ไม่มีจริง แล้วคืนค่าเดิมได้ (เก็บค่าเดิมไว้ก่อนแตะ ปฏิเสธทำงานกับแดชบอร์ดที่มีคนเข้าถึงได้ ไม่เขียนถ้าไม่ใส่ `--apply`) — สภาพนี้ UI สร้างเองไม่ได้แล้วเพราะ guard BUG-008/009 · **ต้องใส่ `--dashboard <id>` เสมอ** ไม่มีค่าเริ่มต้นแล้ว — แดชบอร์ดที่จองไว้ถูกลบ และตอนนี้ทุกตัวใน Firestore เป็นของจริงหมด (2026-08-25) |
| `node scripts/qa-cascade-user.mjs status\|seed\|restore [--apply]` | QA fixture สำหรับ TC 3.2.11 — สร้าง user ปลอม (`uid_qa_cascade`) ที่ถูกอ้างอิงจาก **ทั้งสองฝั่ง** ของ cascade (`groups.members[]` + `folders.assignedModerators[]`) เพื่อให้มีบัญชีที่ลบทิ้งได้ · ระบบสร้างบัญชีได้ทางคำเชิญทางเดียว และ 6 บัญชีบน prod ใช้งานอยู่หมด · ปฏิเสธ uid ที่ไม่ขึ้นต้น `uid_qa_` (restore ลบ user doc จริง) และปฏิเสธ group/folder ที่มีสมาชิก/ผู้ดูแลจริง · `restore` เป็นทางล้างทั้งกรณีที่ลบสำเร็จและกรณีเลิกกลางคัน และคืน `assignedModerators` เป็น "ไม่มีฟิลด์" ด้วย `FieldValue.delete()` เพราะ cascade เขียน `[]` ค้างไว้ · **ต้องใส่ `--folder <id>` เสมอ** ไม่มีค่าเริ่มต้นแล้ว — TEST-E ที่เคยจองไว้ถูกลบพร้อมของทดสอบอื่นทั้งหมด (2026-08-25) และการ seed เขียนลง `folders.assignedModerators[]` การมีค่าเริ่มต้นจึงแปลว่าเผลอแตะโฟลเดอร์จริงได้ |
| `node scripts/inspect-expiry.mjs [dashboardId] [--all]` | Read-only ตรวจ **ร่างจริง** ของ `dashboards.restrictions.expiry` — Firebase console แสดง Timestamp กับ ISO string เกือบเหมือนกัน สคริปต์นี้แยกให้ (`object<Timestamp>` vs `string`) พร้อมบอกว่า `new Date(value)` แบบก่อน PR #364 อ่านออกไหม; ใส่ dashboard id เพื่อดู `access`/`restrictions` + folder chain |
| `npm run cloudbuild:status` | Read-only Cloud Build history for the functions deploy — tells queue expiry (`EXPIRED`, queued ~600s, ran 0s → Google-side, just rerun) apart from a real build failure. Pass a build id for details |
| `node scripts/migrate-company-code.mjs OLD NEW [--apply]` | Rename a company `code` (= its Firestore doc id, which the UI locks). Dry run without `--apply`. Copies the doc, repoints `users.company`, deletes the old one — one atomic batch |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest suite. **Baseline is 334 passing** |
| `npx eslint .` | Lint check (no `lint` npm script exists). **Baseline is 0 — any problem is yours** |
| `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | Typecheck — **never** `-p tsconfig.json` (root is `"files": []`, checks nothing, false pass). **Baseline is 0 — any error is yours** |
| `npx vue-tsc --noEmit -p tests/tsconfig.json` | Typecheck `tests/` — the generated `.nuxt/tsconfig.*` projects do **not** cover it (Nuxt only looks at `tests/nuxt/**`), so test fixtures go unchecked without this. **Baseline is 0** |
| `npx vue-tsc --noEmit -p scripts/tsconfig.json` | Typecheck `scripts/` — same gap, same fix (PR #370). Covers `.ts` only; the `.mjs` scripts stay unchecked on purpose. **Baseline is 0** |
