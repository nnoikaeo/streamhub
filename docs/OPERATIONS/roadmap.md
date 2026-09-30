# StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash (150+ employees)
**Strategy:** Iterative — Features → QA → Deploy

---

## Project Overview

### Organization Structure

- **Group Companies:** 20+ subsidiary companies (STTH, STTN, STCS, STCM, STNR, STPT, STPK, etc.)
- **Users:** 150+ employees across all companies
- **Roles:** User, Moderator, Admin
- **Regions:** 7 regional groups (NORTH, NORTHEAST, EAST, SOUTH, MBR, INNOTECH, ORANGES)

---

## Development Phases

### Phase 1: Core Infrastructure ✅ COMPLETED

**Goal:** Foundational multi-company architecture

- [x] Google OAuth Authentication
- [x] App Layout + Auth Layout
- [x] UnifiedSidebar with role-based accordions
- [x] Base styling & theme (CSS variables + Design System)
- [x] Companies collection + Admin management page
- [x] Regions collection + Admin management page (with sortOrder reordering ⬆️⬇️)
- [x] Groups collection + Admin management page (with sortOrder reordering ⬆️⬇️)
- [x] Firestore mock API (`server/api/mock/`)

---

### Phase 2: Users & Folder Management ✅ COMPLETED

**Goal:** Full CRUD for users + company-scoped folders

- [x] Users list page (`/admin/users`) with DataTable
- [x] User CRUD — UserForm.vue + useAdminUsers composable
- [x] User Invitations — full system with:
  - Admin invite modal + bulk invite
  - API: create, verify, accept, bulk, reactivate
  - Invite accept page (`/invite/accept`)
  - `useAdminInvitations` composable
- [x] Folder Management — `admin/folders` + FolderForm + useAdminFolders
- [x] Moderator folder assignment — ModeratorAssignmentModal
- [x] Permissions store (`canManageTags`, `canAssignTags`, role-based checks)
- [x] Reusable admin patterns — `useAdminResource`, `useAdminCrudPage`
- [x] Centralized toast notification system — `useAppToast` + `AppToast.vue` (auto-toast on save/delete/toggle)

---

### Phase 3: Dashboard Management ✅ COMPLETED

**Goal:** Create, edit, manage dashboards + permissions

- [x] Dashboard Discovery Page (`/dashboard/discover`)
  - FolderSidebar + FolderTree for hierarchy
  - DashboardGrid + DashboardCard for display
  - Breadcrumb navigation, Quick Share dialog — *Quick Share ถูกลบทั้งชุด 2026-08-18 (ไม่มีทางเปิด dialog ในทุก UI) การให้สิทธิ์ผ่านหน้าจัดการสิทธิ์อย่างเดียว*
  - Full mock data support (folders, dashboards)
- [x] Single Dashboard View Page (`/dashboard/view`)
  - Metadata display, Looker embed placeholder (iframe)
  - Quick share, related dashboards sidebar
- [x] Access Control Settings (`/admin/permissions`)
  - PermissionEditor integration (3-layer model)
  - Dashboard selector, save/reset/cancel actions
- [x] Dashboard CRUD — `admin/dashboards` + DashboardForm + useAdminDashboards
- [x] Moderator Permission Management (`/manage/permissions`)

---

### Phase 4: Tag System & Sidebar ✅ COMPLETED

**Goal:** Tag-based categorization, role-based sidebar, Moderator dual-view

- [x] Tag Data Model — `types/tag.ts` + `tags: string[]` on Dashboard
- [x] Tag Store — `stores/tags.ts` (CRUD + caching)
- [x] Tag Composable — `useAdminTags` (admin CRUD via useAdminResource)
- [x] Tag UI Components — TagBadge, TagFilter, TagSelector
- [x] Tag Admin Page — `/admin/tags` + TagForm (with sortOrder reordering ⬆️⬇️)
- [x] Tag API — full CRUD (`server/api/mock/tags/`)
- [x] Sidebar Restructure — `useRoleNavigation`, UnifiedSidebar with role-based accordions
- [x] Moderator Dual-View:
  - `useModeratorFolders` + `useModeratorDashboards` composables
  - Manage Folders accordion in sidebar (FolderAccordion)
  - Moderator Explorer page (`/manage/explorer/[[folderId]]`)
  - DashboardForm with `showTagSelector` / `canCreateTag` / `availableTags`

---

### Phase 5: Looker Integration ✅ COMPLETED

**Goal:** Connect Looker Studio + advanced features

- [x] **Looker Studio Manual URL** — URL input + validation + live preview (`feat/looker-manual-url` → PR #97)
- [x] **Looker Studio API** — Google Sheets API service, 4 API routes, `useLookerApi` composable (`feat/looker-api-service` → PR #98)
- [x] **Dashboard Preview Widget** — thumbnail generation, `DashboardPreview.vue`, `DashboardCard.vue` (`feat/dashboard-preview-widget` → PR #99)

**Plan:** [archive/looker-studio-api-plan.md](archive/looker-studio-api-plan.md) *(archived — completed)*

---

### Phase 5.5: Dashboard View UX ✅ COMPLETED

**Goal:** Improve dashboard view page UX and navigation

- [x] **Dashboard View Page restructure** — moved `view.vue` → `view/[id].vue` (dynamic route), fixed 404
- [x] **Hydration mismatch fixes** — wrapped auth-dependent UI in `<ClientOnly>` (UserMenu, sidebar, QuickActions)
- [x] **Dashboard Info sidebar** — toggle show/hide (admin only), hidden by default
- [x] **Fullscreen mode** — expand embed to fullscreen, Esc to exit, default on open — *superseded by the native Fullscreen API in PR #351, see below*
- [x] **Breadcrumb Thai** — "Dashboard" → "แดชบอร์ด"
- [x] **Share button** — navigate to `/admin/permissions` (admin/moderator only) — *เอาปุ่มออก 2026-08-18: หน้าปลายทางเป็น admin-only แต่ปุ่มโชว์ให้ moderator ด้วย (BUG-019) ตอนนี้เข้าจาก Explorer 🔑 ซึ่งเลือก path ตาม role*
- [x] **⋮ Dropdown menu** — Thai labels (แก้ไขข้อมูล / ดาวน์โหลด / เก็บถาวร), z-index fix, hover fix
- [x] **Go Back** — `router.back()` to the page of origin (Explorer folder/scroll preserved), falls back to `/dashboard/discover` on cold entry
- [x] **Dropdown styling** — fixed global button CSS override (added `.menu-item` to exclusion list in `main.css`)

#### Dashboard View actions ✅ COMPLETED

- [x] **แก้ไขข้อมูล** — edit dialog (name/description/tags) via `handleEditInfo()` + `handleEditSave()` in `app/pages/dashboard/view/[id].vue`
- [x] **ดาวน์โหลด** — `handleDownload()` uses browser `window.print()` (print-mode CSS)
- [x] **เก็บถาวร** — archive confirm dialog + soft-delete (`isArchived` / `archivedAt` on Dashboard)

#### Dashboard View — fullscreen & zoom ✅ COMPLETED (PR #351)

- [x] **Native fullscreen** — the `เต็มจอ` button now calls the Fullscreen API (with `webkit*` fallbacks) on `document.documentElement` instead of only toggling a CSS overlay. Targets the root, not the pane, so dialogs and toasts stay visible. `fullscreenchange` keeps the label in sync; `Esc` and the `ย่อ` button both exit
- [x] **Embed zoom control** — `− / % / +` in the header, 40–100% in 10% steps, persisted in `localStorage` (`streamhub:embed-zoom`). Needed because browser zoom is a no-op on this page: the Looker embed always rescales the report to fit the iframe width. Fix keeps the iframe width and makes it taller (`100%/z`) before scaling down — an **asymmetric** scale is what reveals extra rows

---

### Phase 5.7: Discover Page Compact & Multi-View Redesign ✅ COMPLETED

**Goal:** Multi-view modes (Grid/Compact/List), collapsible folder groups, card limits

- [x] **View Mode Switcher UI** — 3-mode toggle (Grid/Compact/List) with localStorage persistence
- [x] **Compact Card Mode** — smaller cards (80px thumbnail), 5-6 column grid, whole-card clickable
- [x] **List View Components** — `DashboardListItem.vue`, `DashboardList.vue` (horizontal row layout, ~48px/row)
- [x] **List View Grouped & Wiring** — `GroupedDashboardList.vue`, integrated into `discover.vue`
- [x] **Collapsible Folder Groups** — collapse/expand with chevron animation, expand/collapse all buttons
- [x] **Card Limit Per Folder** — max 4 (grid), 6 (compact), 8 (list) with "ดูทั้งหมด" link
- [x] **Responsive Testing** — Desktop/Tablet/Mobile breakpoints, 200ms transitions

**Plan:** ~~[discover-redesign-tasks.md](archive/discover-redesign-tasks.md)~~ *(archived — completed)*

---

### Phase 5.8: Discover Tree View & Group By System ✅ COMPLETED

**Goal:** Unified tree view, group-by switcher (folder/tag/company/none), slim dividers, adaptive columns

- [x] **Breadcrumb Actions Slot** — `#breadcrumb-actions` slot in PageLayout + search bar moved (PR #120)
- [x] **GroupBySwitcher** — 4-mode icon button group (folder/tag/company/none) with localStorage (PR #121)
- [x] **Group By Logic** — computed grouping by tag, company, none + `DisplayGroup` interface (PR #122)
- [x] **Adaptive Columns** — list view columns change based on group-by mode (PR #123)
- [x] **TreeDashboardList** — unified tree table replacing GroupedDashboardList (PR #124)
- [x] **GroupDivider** — slim dividers for grid/compact views, 28px/24px height (PR #125)
- [x] **Flat Mode** — no-grouping mode for all views (PR #126)
- [x] **Responsive & Polish** — mobile/tablet breakpoints, accessibility, transitions (PR #127)
- [x] **Bugfix** — button style overrides, column alignment, default view (PR #128)

**Plan:** [discover-tree-view-groupby-plan.md](archive/discover-tree-view-groupby-plan.md) *(completed)*

---

### Phase 6: Enhancement & Polish ✅ COMPLETED

**Goal:** UX improvements, real Firebase integration, deploy

- [x] **Dashboard Lazy Loading** — Intersection Observer, 12 items/batch
- [x] **Looker Embed Security Hardening** (P0 — Critical)
  - [x] Server auth middleware (Firebase ID token verification)
  - [x] Server-side permission check before returning embed URLs
  - [x] CSP headers + referrer restriction
  - [x] Signed/expiring embed URLs (token-based proxy `/api/embed/[token]`)
- [x] **Server-Side Company Access Control**
  - [x] Middleware validation
  - [x] API endpoint enforcement
  - [x] Client-side guards (`useCompanyAccess`)
- [x] **Real Firebase Integration** — Firestore replacing mock API in production
- [x] **Cross-browser testing + performance optimization**
- [x] **Deploy to Firebase Hosting** — `streamhub-1c27a.web.app`

---

### Phase 7: QA & Bug Fixes ✅ COMPLETED

**Goal:** Manual test plan execution, bug fixes, production stability

- [x] **Pre-launch checklist A–E PASSED** (2026-07-18) — Route Protection, Admin Edit/Delete, Invitations, Permissions, Moderator folder-scoped access — see [pre-launch-checklist.md](archive/pre-launch-checklist.md). App launch-ready at <https://streamhub-1c27a.web.app>
- [x] **Manual Test Plan** — [manual-test-plan.md](manual-test-plan.md): 145 cases at the time, **215 today** (201 ✅ / 1 🔍 / 0 ☐ / 11 ⊘ / 2 🐛, 2026-09-28) — current totals in its [§ 9 Test Case Summary](manual-test-plan.md#9-test-case-summary)
  - [x] Section 1: Authentication & Onboarding (TC 1.1–1.2) ✅
  - [x] Section 2.1: Dashboard Home ✅
  - [x] Section 2.2: Dashboard Discover (12/12 passed; BUG-001/002/003 fixed) ✅
  - [x] Section 2.3+: remaining dashboard, admin, moderator pages ✅ — run page by page after pre-launch A–E (2026-07-26 → 2026-08-20), every section closed
- [x] **Recent Dashboards tracking** — เปลี่ยนจาก `updatedAt` → localStorage per-user (PR #237)
- [x] **Fix embed URL in production** — `/api/embed/request` อ่าน user+dashboard จาก Firestore (PR #239)
- [x] **Quick Actions uniform style** — ลบ primary style จากปุ่ม "สร้างแดชบอร์ด" (PR #241)
- [x] **Sidebar folder tree removal documented** — Phase 5 design decision บันทึกแล้ว (PR #243)

**Plans:**

- [archive/phase6-implementation-plan.md](archive/phase6-implementation-plan.md) *(archived — completed)*
- [archive/user-invitations-plan.md](archive/user-invitations-plan.md) *(archived — completed)*

---

### Phase 8: Production Readiness Hardening ✅ COMPLETED

**Goal:** Harden dev/production boundary, automated CI checks

- [x] Harden Auth Middleware (PR #202)
- [x] Fix Localhost Fallbacks + Env Validation (PR #203)
- [x] Fix Audit Log Fallback (PR #205→#206)
- [x] Health Check API + Status Page (PR #207→#208) — `/admin/health`
- [x] Production Readiness Test Suite — 12 test files / 134 tests, CI runs `npm test` on deploy + preview
- [x] Standardize service-mode flag — `useServiceMode` composable (Firestore vs JSON mock)
- [x] Disable Mock API in production — `server/middleware/blockMockApi.ts` returns 404 for `/api/mock/*` in prod builds

---

### Phase 9: Lint & Typecheck Debt ✅ COMPLETED

**Goal:** Get the verify commands back to a meaningful signal

- [x] **eslint 716 → 382** (PR #353) — autofix, dead-code removal, and every remaining rule cleared except `no-explicit-any`. Two rules turned off with rationale in `eslint.config.mjs`: `vue/multi-word-component-names` for the `ui/` primitives, `vue/require-default-prop` for type-first props
- [x] **vue-tsc 44 → 0** (PR #353) — surfaced two live bugs: `QuickShareDialog` read `user.id` on a type that only has `uid` (share from Discover emitted `userIds: [undefined]`), and `PermissionsPage` wrote `setByName: user.value?.name`, recording provenance blank
- [x] **`no-explicit-any` 382 → 85** — reviewed PRs, all on `main`:
  - **#354** — added `shared/utils/errors.ts` (auto-imported into both `app/` and `server/`) and moved all 71 `catch (e: any)` to `unknown`. 382 → 311
  - **#355** — validators, type guards, debug logs, `PermissionsPage` props, and casts that were covering nothing. 311 → 268
  - **#356** — reused types that already existed elsewhere; `($firebase as any).db` turned out to be four leftover casts. 268 → 245
  - **#357** — all of `tests/`, but only after adding `tests/tsconfig.json`: no generated `.nuxt/tsconfig.*` project covers `tests/`, so the directory had never been typechecked. It immediately caught 34 errors, including `healthEndpoint.test.ts` reading `result.checks` off an unnarrowed union. 245 → 171
  - **#358** — generic constraints to `T extends object`. Surfaced a Timestamp-vs-Date mismatch in `useFirestoreService` and a value round-tripped through an untyped bag in `invitations/[id].put.ts`. 171 → 137
  - **#359** — `jsonDatabase` gains a `JsonRecord` constraint; every `readJSON`/`findById` call passes its row type. **Found a live bug:** `GET /api/mock/dashboards?company=X` indexed `access.company` (a list) as if it were a map, so the filter returned nothing for every company. 137 → 85
  - **#361** — invitation and audit API response types, written against the handlers rather than guessed. Consolidated three conflicting definitions of `AuditEntry` and six copies of a stored-user shape. 85 → 57
  - **#364** — the permission path, all 40 sites: `companyAccess.ts` (17), `useDashboardService` (14), `useFirestoreService` (5), `useJSONMockService` (4). The access rules now read named shapes (`AccessDashboard`/`AccessFolder`/`AccessUser`) instead of `any`, and `CompanyAccessResult` became a discriminated union. **Found four live bugs:** expiries never fired on the Firestore path (`new Date(timestamp)` → `Invalid Date` → compares false → access granted), `getDashboardCard` dropped its `currentUserId`, the JSON wrapper called `saveDashboardPermissions` with two arguments against a one-parameter method, and `getAuditLog` discarded `limit`. Added `shared/utils/dates.ts`. 57 → 17
  - **#365** — everything outside the permission path. **Found a live bug:** `/admin/dashboards` wired the modal's save button straight to `handleSave`, so create/update received FormModal's native FormData scrape — and `FormField` names its inputs `field-${Math.random()}`, so the payload carried random keys, never `name`/`folderId`/`lookerEmbedUrl`, and skipped validation. Also surfaced the multi-select emitting `(string | number)[]` into a `string[]` prop. 17 → 3
  - **#366** — the last two decision-sites, both closed by deleting code: the store's company getters filtered on a field no document has and nothing called (always `[]`), and `useAdminResource`'s extension index signature typed every property `any` to serve three helpers, which moved into `useAdminFolders`/`useAdminDashboards`. 3 → **0**
- [x] **`no-explicit-any` — 0 left.** Backlog closed. eslint baseline is now 0, so any violation is a regression
- [x] **Two unreachable code paths deleted** (PR #371) — `MockDashboardService` (~510 lines) sat behind `else` in `useDashboardService`, but `useServiceMode` exposes exactly two modes (`isMock = !isFirestore`), so the `else if (useJsonMock)` before it was already exhaustive and the branch could never run. It was not inert: its access check read `if (access.company.length === 0) return true` — "no company means everyone" — the pre-DESIGN-001 rule, so wiring it back up would have handed out public access to every private dashboard. `useAdminInvitations`' `fetchByCompany` / `fetchByStatus` went too: both `GET /api/invitations`, which has no handler (`server/api/invitations/` has no `index.get.ts`), and nothing called either — the list page reads Firestore through `useAdminResource.fetch`
- [x] **`scripts/` brought under a compiler** (PR #370) — the same gap `tests/` had before #357: none of the four generated `.nuxt/tsconfig.*` projects covers `scripts/`, so `seed-firestore.ts` had never been typechecked and carried a real `TS2345` (`convertDatesToTimestamps` took `Record<string, unknown>` but its own recursive call passes a value narrowed to `object`, which has no index signature). Covers `.ts` only — `allowJs` + `checkJs` over the five `.mjs` scripts reports 70 errors, every one of them inference noise rather than a defect

### Phase 10: Google Sheets Embeds ✅ COMPLETED

**Goal:** Let a dashboard be a link-shared Google Sheet, not only a Looker report

Decided 2026-09-06 after the measurement spike ([google-sheets-spike-plan.md](archive/google-sheets-spike-plan.md)); built to [google-sheets-embed-plan.md](archive/google-sheets-embed-plan.md). What works where today: [google-sheets-embeds.md](../REFERENCE/google-sheets-embeds.md).

- [x] **Sheets through the existing embed-token pipe** (PR #472) — `Dashboard.type` widened to `'looker' | 'sheet'`; the URL is stored whole (`sheetEmbedUrl`) because a published sheet is served under `/d/e/2PACX-…`, a different id from the file id and not derivable from it. The AES-256-GCM seal, the session cookie and the 302 needed no change — none of them knew about domains
- [x] **The response strip became one list** — `lookerEmbedUrl` had been stripped at three sites with the field name spelled out in each. One missed `sheetEmbedUrl` leaks the URL out of the API listing and voids the embed token, so `EMBED_URL_FIELDS` in `shared/utils/embedUrl.ts` holds the list. A **fourth site the plan had not listed** (`[id]/embed-url.get.ts`) named the looker field directly and would have answered `null` for every sheet dashboard
- [x] **`POST /api/sheet/check-sharing`** — probes the sheet's CSV export from the server with no credentials attached (200 = link-shared, 401 = not). Admin/moderator only, and the probe URL is rebuilt from the parsed sheet id rather than taken from the request body, so it cannot be used as a URL prober on our IP
- [x] **Type icons in every list** (PR #473) — `DashboardTypeIcon.vue` holds the type→glyph mapping once, used by the admin explorer, the search dropdown, `DashboardCard` and `DashboardListItem`. Before it, the workaround for telling a sheet from a report was writing the type into the dashboard's name
- [x] **Manual testing found two bugs nothing automated could see** — the segmented pickers showed no selection at all (BUG-033: `main.css` forces background and colour onto every `button` not named in its exclusion list, which is exactly how those controls mark the selected option), and the sharing check was advisory rather than a guard (BUG-034: it reported 401 and the form saved anyway, producing the Safari dead-end it exists to prevent)

- [x] **Google's menu bar on every sheet** (PR #476, 2026-09-26) — stakeholders asked for File / Edit / View… inside the frame. New `full` mode (`/edit`, no `rm`) is the default; `interactive` and `view` stay. The 3 existing sheet dashboards were moved with `scripts/migrate-sheet-full-mode.mjs`. The sheet iframe lost `allow-top-navigation-by-user-activation`, which had let Google's in-frame "Sign in" take the whole tab out of StreamHub. Spike: [google-sheets-menubar-spike.md](archive/google-sheets-menubar-spike.md)
- [x] **Every sheet was blank on production Safari and iPhone — since #472** (BUG-036, PR #477, 2026-09-27) — Google sends a cookieless frame through `accounts.google.com/ServiceLogin?passive=…` first, and `frame-src` did not list that origin. localhost never took that detour, which is how it shipped. Fixing it also made desktop Safari **edit** like Chrome: the passive sign-in now completes inside the frame
- [x] **The read-only hint moved to phones** (PR #478) — #476's bar told all of WebKit "read-only, use Chrome"; that was the CSP bug talking. What is read-only is a phone, where Google serves its mobile page whatever the mode. `isPhone()` in `app/utils/browser.ts`

**Not done, deliberately:** Drive permission sync, writing back to a sheet, Google Docs/Slides. A type filter on Discover was considered and deferred — the icons answer the question a filter would, and one sheet among thirty dashboards does not need one yet.

### Phase 11: Sheets Follow-ups ✅ COMPLETED

**Goal:** Close what the Sheets work (#472–#479) left open, and make sure BUG-036 cannot come back quietly

Listed 2026-09-27. Background for every item: [google-sheets-embeds.md](../REFERENCE/google-sheets-embeds.md).

All four code/QA items done 2026-09-28 (#481–#487). What is left below needs a person or a decision, not code.

**Items 1 and 2 together** (small, no user-facing change):

- [x] **1. Guard the CSP with a test** ✅ DONE — [securityHeaders.test.ts](../../tests/server/securityHeaders.test.ts) runs the middleware for real and reads the static copy out of `firebase.json`. It asserts that `frame-src` in [securityHeaders.ts](../../server/middleware/securityHeaders.ts) **and** [firebase.json](../../firebase.json) both contain `https://docs.google.com`, `https://accounts.google.com` and `https://lookerstudio.google.com`, and that the two lists agree apart from the runtime `authDomain` the middleware appends. Removing `accounts.google.com` from either file fails two tests. BUG-036 shipped because nothing checked this: lint, typecheck and the suite all passed while every sheet on prod Safari was blank
- [x] **2. Fix the stale Phase 9 marker** ✅ DONE — Phase 9 read 🔄 IN PROGRESS although every item was `[x]` and the `any` backlog closed; its `#359 … not yet back-merged` line was dropped too (#359 reached `main` on 2026-08-14)

**Found and fixed while running items 1–4** (all on prod, verified by hand):

- [x] **BUG-037** (#482) — `/admin/explorer` on iPad showed no folder or dashboard names: a bare `1fr` next to 520px of fixed columns resolved to 0. The name column now has a floor; below 720px a container query hides the type column
- [x] **`SegmentedControl`** (#484) — one `ui/` component for the dashboard type and sheet mode pickers: a joined strip, the chosen option filled, keyboard-accessible. It also removed the stale "edits on Chrome only" hint
- [x] **BUG-038** (#486) — cached chunks re-injected an old `entry.*.css` after a trip to a dashboard, because Vite writes file names into `__vite__mapDeps` after hashing. Two build plugins in `nuxt.config.ts` fix it — see [deployment.md § Browser caching](deployment.md#browser-caching-of-_nuxt)
- [x] **Housekeeping** (#490–#492) — dead `QuickShareInput` type removed; the permissions page lost its own dashboard/folder picker (toggle + search dropdown, reachable only by typing the URL since the sidebar entry went in March) — without `?dashboard`/`?folder` it now redirects to Explorer (#491 moved the toggle to `SegmentedControl`, #494 removed it; TC 3.10.24, 4.2.1, 4.2.5 ✅ on prod); a tab left open across a deploy gets a "มี StreamHub เวอร์ชันใหม่ — โหลดใหม่" bar (TC 5.2.6 ✅ — first seen on the deploy after #492) ([deployment.md § Browser caching](deployment.md#browser-caching-of-_nuxt))

**When a device is at hand:**

- [x] **3. Measure sheets on iPad** ✅ DONE 2026-09-27 — as expected: `SAI` in `full` mode on iPad Safari got the desktop page with the menu bar, a typed cell saved (deleted at once), and no sheet hint bar. Recorded in manual-test-plan 7.1.i and the reference doc. The same session found **BUG-037** (admin Explorer showed no names on iPad), fixed in the same PR. Planned as: open a `full`-mode sheet (e.g. SAI) with an account that can edit it, type into an empty cell and delete it at once. Expected: iPadOS asks for the desktop site, so it edits like macOS Safari and shows **no** sheet hint bar (`isPhone` excludes iPad). Record the result in [manual-test-plan.md](manual-test-plan.md) 7.1.i and the reference doc. **Android: no device available** — stays unmeasured; expected to behave like iPhone (read-only mobile page, hint bar shown)
- [x] **4. Numbered test cases for sheet dashboards** ✅ DONE 2026-09-28 — [manual-test-plan.md](manual-test-plan.md) 3.13.10–3.13.13, all four passed on prod (Chrome + iPhone Safari). 3.13.12 surfaced **BUG-038** (stale chunks re-injecting an old `entry.*.css`, fixed in #486); 3.13.11's first draft asked for 150% zoom, but zoom stops at 100% by design (#351). Running 3.13.10 also led to replacing both pickers in the dashboard form with one `SegmentedControl`. Planned as: the P5 pass was ad hoc. Add to [manual-test-plan.md](manual-test-plan.md): an unshared sheet is refused at save (BUG-034 guard), zoom on a sheet grows rows *and* columns, switching mode rewrites the stored URL, and the phone hint bar

**Waiting on a person, not code** — do not start these without the decision:

- **M6 — viewer download switch.** Waits on the next stakeholder meeting. Only matters if `allow-downloads` is ever considered
- **Tell the meeting the result beat the decision** — they accepted "edit on Chrome only"; desktop Safari edits too, only phones are read-only
- **Watch, don't build:** Google's `RotateCookiesPage` is refused inside our frame, so a sheet left open for hours on Safari may lose its session — measure before acting. The Discover type filter stays deferred until there are enough sheets to need it

### Tester feedback — 2026-09-30

- [x] **BUG-039** (#497) — the user menu showed the Google account name, not the name an admin set on `/admin/users`; it now reads `users.name` first · verified on prod 2026-09-30
- [x] **Groups in the permission editor** (#498) — groups under each user in the picker (green = already granted through it), member names under each granted group, a warning for a group that grants nobody · TC 3.10.25–3.10.26
- [x] **BUG-040 group membership drift** (#500) — accepting an invitation now writes `groups.members[]` and `folders.assignedModerators[]` in the same batch as the user; the permission page's access preview reads members from `users.groups[]` like the server; `audit:orphans` reports one-sided membership; `scripts/sync-group-members.mjs` repairs existing data (prod: `admin` group gains three admins) · TC 3.9.11
- [x] **Groups in the user menu + profile polish** (#499) — the menu shows the user's groups (two chips + `+N`, no green: there is no dashboard to compare against) and the role in Thai, the same label as the profile badge (`roleLabel`); the profile's group card drops deleted-group ids and says what groups are for · TC 2.4.6–2.4.7 · **2d** (#501, option A chosen over a per-dashboard "why can I see this" card): a `แดชบอร์ด · เข้าถึงได้ N รายการ ดูทั้งหมด →` row, counted from the same access-checked list as Discover · TC 2.4.8
- [x] **`/admin/users` shows group names** (#502) — the groups column printed `users.groups[]` ids (`marketing`), so a group rename never reached it; now `#cell-groups` via `userGroupChips`, colour keyed by id so it survives a rename · the `isGroupsColumn` flag had no other user and was removed from `DataTable` · TC 3.2.13
- [x] **"แชร์ให้ฉัน" counts group and company grants** (#503) — the home card counted only `access.direct.users`, so "ก ข" saw 3 while Discover and the profile said 4 (SAI via group Sales). It now counts the same access-checked list, with a `สิทธิ์ตรง 3 · ผ่านกลุ่ม 1` line (hidden for admins, who see everything by role) · TC 2.1.8 · note: Discover ignores the card's `?filter=shared`, so "ดูเพิ่มเติม →" lands on the full list
- [x] **Admins hold no groups** (#504) — three admins had been invited into an `Admin` group, which the permission editor then offered as something to grant. The group was **deleted on prod 2026-09-30** (by script: `groups/admin` removed and the id stripped from the three users in one batch; no dashboard or folder granted it; `audit:orphans` 0 after; no Audit Log entry because it did not go through the UI). To stop it coming back: the user form and both invite forms hide the group picker for role admin, and `groupsForRole()` (`shared/utils/roleGroups.ts`) empties groups for admins on save, accept and reactivate — a user promoted to admin loses their groups on save, one demoted to moderator/user starts with none and gets them from the form · TC 3.2.14, 3.9.12
- [x] **Reactivate mirrors groups** (#505) — `invitations/reactivate` (Firestore + mock) now writes `groups.members[]` in the same batch as the user: `planGroupMembership` compares against every group, so the uid ends up listed by exactly the groups its `groups[]` names — including leaving stale entries from before deactivation, and leaving all of them when reactivated as admin
- [x] **`vue-tsc` back to 0 on a fresh `nuxi prepare`** (#505) — `SegmentedControl`'s `ariaLabel` prop is now `label`. vue-tsc types `aria-label` on a component as the built-in ARIA attribute, so it never bound to the prop, generic `T` fell back to `string`, and both call sites (`DashboardForm`, `SheetUrlInput`) failed typecheck since #484 — invisible on a stale `.nuxt`. camelCase `ariaLabel=` at the call site also works but trips `vue/attribute-hyphenation`

All nine PRs are on prod; every new test case except two passed on prod the same day ([manual-test-plan.md](manual-test-plan.md) §9: 228 cases, 212 ✅, 2 ☐). Data changes on prod: `admin` group members synced, then the group deleted (BUG-041); `audit:orphans` 0 after both. The `SegmentedControl` pickers were re-checked in the browser after #505.

**Still open — start here next session:**

- [ ] **TC 3.9.11** — accept an invitation end to end (BUG-040 fix): needs a Google account not yet in StreamHub; delete it afterwards through `/admin/users` so the cascade runs
- [ ] **TC 3.9.13** — reactivate a deactivated account with a different group (#505): needs a disposable test account
- [ ] **Invitation rows show the company at invite time** — survey's accepted invitation reads `ORAY` while the user is now `OAYT`. Decide whether accepted rows should show the user's current company; nothing is wrong in the data
- [ ] **Discover ignores `?filter=my` / `?filter=shared`** — both home cards link there and land on the full list. Pre-existing, noted with #503

---

## Remaining Backlog (non-blocking)

Feature stubs, optional — app fully functional without them:

- [x] **QuickActions create dashboard** ✅ DONE (PR #413) — the button pointed at `/dashboard/create`, a page that was never written, so moderators and admins hit a full-screen 404. It now goes to Explorer by role (`/admin/explorer`, `/manage/explorer`), where dashboards are actually created; no second copy of the create form
- [x] **BUG-005 delete direction** ✅ DONE (PR #409, #410) — deleting a group or a user now warns about what it will touch, then clears `user.groups[]` / `group.members[]` / `folders.assignedModerators[]`; `audit:orphans` gained a moderator check that immediately found five stale folders on prod, cleaned with the new `scripts/clean-orphan-refs.mjs` · **verified on prod 2026-08-20** (PR #416, TC 3.2.11) — the user side had shipped unexercised because no account was disposable, so `scripts/qa-cascade-user.mjs` now seeds and removes a `uid_qa_` fixture referenced from both a group and a moderated folder
- [x] **BUG-026** ✅ DONE (PR #413) — an offline banner now says the save will hang and that nothing is lost. No timeout: cutting the promise short would abandon a write the SDK still completes once the connection returns
- [x] **BUG-027** ✅ DONE (PR #413) — saving a role change away from moderator now asks first, naming how many folders the user will lose and that promoting them back does not restore them
- [x] ~~Home page **create folder** button~~ **ปิดด้วยการลบ** (PR #395) — ปุ่ม `+` กดไม่ถึงอยู่แล้ว: `PageLayout` ส่ง `:allow-create` ต่อให้ `UnifiedSidebar` ซึ่ง render แค่ `AdminAccordion` ไม่เคย render `FolderSidebar` · Explorer สร้างโฟลเดอร์ได้จริงอยู่แล้ว จึงลบทั้งสาย prop/event/handler แทนที่จะต่อ
- [x] ~~Home page **share** button~~ ลบไปพร้อม Quick Share (2026-08-18, BUG-017)
- [x] ~~Explorer **folder creation dialog**~~ ลบพร้อมกัน (PR #395) — `handleCreateFolder` ใน `useDashboardPage` เป็น `console.log` ที่ไม่มีทางถูกเรียก
- [x] **Profile page** + nav ✅ **DONE** (PR #396) — `/profile` อ่านอย่างเดียว: ตัวตน, บทบาท, บริษัท, สถานะ, วันเข้าร่วม, กลุ่ม + โฟลเดอร์ที่ดูแล (moderator) · อ่าน `users/{uid}` ของตัวเอง + lookup companies/groups ซึ่งอยู่ในสิทธิ์ที่ rules ให้อยู่แล้ว
- [x] ~~**Settings page** + nav~~ **ปิดด้วยการลบ** (PR #396) — ยังไม่มีค่าอะไรให้ผู้ใช้ตั้ง (ธีม/ภาษา/แจ้งเตือน ไม่มีในระบบ) เมนูที่กดแล้วเงียบถูกเอาออก · **wireframe `admin-system-settings-page.md` ถูกลบตามไปด้วย** — ค้างอยู่อีก 4 เดือนหลังการตัดสินใจนี้ โดยเขียนว่า "to be created" ซึ่งอ่านเหมือนงานที่รอทำ ทั้งที่ถูกปิดไปแล้ว
- [x] **Dashboard view back button returns to origin** ✅ DONE (PR #328, #329) — `handleGoBack()` in `app/pages/dashboard/view/[id].vue` now uses `router.back()` when in-app history exists, falling back to `/dashboard/discover` on cold entry. Archive flow keeps the explicit push to Discover (previous listing is stale after archiving)
- [x] **Back-navigation cold-entry guard** ✅ DONE (PR #329, #330) — back handlers must test `window.history.state?.back` (the previous **in-app** entry, `null` on cold entry), not `window.history.length` (counts the whole tab, so a direct link opened after visiting another site navigated out of the app). Applied in `app/pages/dashboard/view/[id].vue` → `handleGoBack()` and `app/components/features/PermissionsPage.vue` → `goBackToExplorer()`. Use the same check for any new back button

---

## Current Implementation

### Pages (23 pages)

```text
app/pages/
├── index.vue                          Redirect
├── login.vue                          Google OAuth login
│
├── profile.vue                        Read-only profile (all roles)
│
├── dashboard/
│   ├── index.vue                      Dashboard home
│   ├── discover.vue                   Browse dashboards (all roles)
│   └── view/[id].vue                  Single dashboard view (dynamic route)
│
├── admin/
│   ├── index.vue                      Admin dashboard overview
│   ├── overview.vue                   Admin overview
│   ├── permissions.vue                Permission editor (3-layer)
│   ├── audit.vue                      Audit logs
│   ├── health.vue                     System health
│   ├── explorer/[[folderId]].vue      Admin folder explorer
│   ├── companies/index.vue            Company CRUD
│   ├── dashboards/index.vue           Dashboard CRUD (orphan route)
│   ├── folders/index.vue              Folder CRUD
│   ├── groups/index.vue               Group CRUD
│   ├── invitations/index.vue          Invitation management
│   ├── regions/index.vue              Region CRUD
│   ├── tags/index.vue                 Tag CRUD
│   └── users/index.vue                User CRUD
│
├── manage/
│   ├── permissions.vue                Moderator permission editor
│   └── explorer/[[folderId]].vue      Moderator folder explorer
│
└── invite/
    └── accept.vue                     Invitation acceptance
```

### Stores (4 stores)

| Store | Purpose |
|-------|---------|
| `auth.ts` | Authentication state, user session |
| `dashboard.ts` | Dashboard state management |
| `permissions.ts` | Role-based permissions (canManageTags, canAssignTags, etc.) |
| `tags.ts` | Tag CRUD + caching |

### Composables (25 composables)

| Category | Composables |
|----------|-----------|
| **Admin CRUD (11)** | useAdminBreadcrumbs, useAdminCompanies, useAdminCrudPage, useAdminDashboards, useAdminFolders, useAdminGroups, useAdminInvitations, useAdminRegions, useAdminResource, useAdminTags, useAdminUsers |
| **Moderator (2)** | useModeratorFolders, useModeratorDashboards |
| **Core (13)** | useAppToast, useAuth, useCompanyAccess, useDashboardPage, useDashboardService, useExplorer, useForm, useJSONMockService, useLookerApi, usePaginatedList, useRecentDashboards, useRoleNavigation, useSidebarVisibility |

### Mock API Endpoints

All entities have REST endpoints under `server/api/mock/`:

- **Companies** — GET, POST, PUT/:code, DELETE/:code
- **Dashboards** — GET, POST, GET/:id, PUT/:id, DELETE/:id
- **Folders** — GET, POST, GET/:id, PUT/:id, DELETE/:id
- **Groups** — GET, POST, PUT/:id, DELETE/:id
- **Invitations** — GET, POST, PUT/:id, DELETE/:id, verify, accept, bulk, reactivate, check
- **Regions** — GET, POST, PUT/:code, DELETE/:code
- **Tags** — GET, POST, GET/:id, PUT/:id, DELETE/:id
- **Users** — GET, POST, GET/:uid, PUT/:uid, DELETE/:uid

Looker Studio API proxy under `server/api/looker/`:

- `GET /api/looker/status` — Check API credential status
- `GET /api/looker/reports` — List available Looker reports
- `GET /api/looker/reports/:id` — Get single report metadata
- `POST /api/looker/sync` — Sync dashboard metadata from Looker

Thumbnail API under `server/api/thumbnail/`:

- `GET /api/thumbnail/:dashboardId` — Generate SVG placeholder thumbnail

### Mock Data (`.data/`)

9 JSON files: audit-log, companies, dashboards, folders, groups, invitations, regions, tags, users

---

## Success Criteria

- [ ] All 150 users can login with Google OAuth
- [x] Users Management functional (CRUD + invitations)
- [x] Dashboard Management working (CRUD + permissions)
- [x] Looker Studio URL input, validation, and live embed preview
- [x] Google Sheets embeds: link-shared sheets through the same embed-token pipe, with an automatic sharing check that blocks saving an unshared sheet
- [x] Role-based access control working (permissions store)
- [x] Tag system: Admin CRUD, Moderator assign, User filter
- [x] Sidebar navigation: role-based menus
- [x] Moderator dual-view: Viewer mode + Manager mode
- [x] Dashboard discovery: multi-view modes (Grid/Compact/List), collapsible folders, card limits
- [x] Discover page: tree view, group-by (folder/tag/company/none), slim dividers, adaptive columns
- [x] Looker embed security hardening (auth middleware, CSP, signed URLs)
- [x] Dashboard lazy loading (Intersection Observer)
- [x] Performance: Page load < 2 seconds
- [x] Mobile responsive
- [x] Replace mock API with real Firestore

---

## Related Documents

- [Roles & Permissions](../GUIDES/roles-and-permissions.md) — RBAC rules
- [Database Schema](../GUIDES/database-schema.md) — Firestore collections
- [Component Architecture](../DESIGN/COMPONENT_ARCHITECTURE.md) — 4-layer system
