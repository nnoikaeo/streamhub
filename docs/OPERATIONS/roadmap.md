# StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash (150+ employees)
**Strategy:** Iterative — Features → QA → Deploy
**Last Updated:** 2026-07-18

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

**Plan:** ~~[discover-redesign-tasks.md](discover-redesign-tasks.md)~~ *(archived — completed)*

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

**Plan:** [discover-tree-view-groupby-plan.md](discover-tree-view-groupby-plan.md) *(completed)*

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

- [x] **Pre-launch checklist A–E PASSED** (2026-07-18) — Route Protection, Admin Edit/Delete, Invitations, Permissions, Moderator folder-scoped access — see [pre-launch-checklist.md](pre-launch-checklist.md). App launch-ready at https://streamhub-1c27a.web.app
- [x] **Manual Test Plan** — [manual-test-plan.md](manual-test-plan.md) (145 test cases)
  - [x] Section 1: Authentication & Onboarding (TC 1.1–1.2) ✅
  - [x] Section 2.1: Dashboard Home ✅
  - [x] Section 2.2: Dashboard Discover (12/12 passed; BUG-001/002/003 fixed) ✅
  - [ ] Section 2.3+: remaining dashboard, admin, moderator pages (superseded by pre-launch A–E)
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

### Phase 9: Lint & Typecheck Debt 🔄 IN PROGRESS
**Goal:** Get the verify commands back to a meaningful signal

- [x] **eslint 716 → 382** (PR #353) — autofix, dead-code removal, and every remaining rule cleared except `no-explicit-any`. Two rules turned off with rationale in `eslint.config.mjs`: `vue/multi-word-component-names` for the `ui/` primitives, `vue/require-default-prop` for type-first props
- [x] **vue-tsc 44 → 0** (PR #353) — surfaced two live bugs: `QuickShareDialog` read `user.id` on a type that only has `uid` (share from Discover emitted `userIds: [undefined]`), and `PermissionsPage` wrote `setByName: user.value?.name`, recording provenance blank
- [x] **`no-explicit-any` 382 → 85** — six reviewed PRs. #354–#358 are on `main`; **#359 is merged to `develop` and not yet back-merged**:
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

---

## Remaining Backlog (non-blocking)

Feature stubs, optional — app fully functional without them:

- [x] **QuickActions create dashboard** ✅ DONE (PR #413) — the button pointed at `/dashboard/create`, a page that was never written, so moderators and admins hit a full-screen 404. It now goes to Explorer by role (`/admin/explorer`, `/manage/explorer`), where dashboards are actually created; no second copy of the create form
- [x] **BUG-005 delete direction** ✅ DONE (PR #409, #410) — deleting a group or a user now warns about what it will touch, then clears `user.groups[]` / `group.members[]` / `folders.assignedModerators[]`; `audit:orphans` gained a moderator check that immediately found five stale folders on prod, cleaned with the new `scripts/clean-orphan-refs.mjs`
- [x] **BUG-026** ✅ DONE (PR #413) — an offline banner now says the save will hang and that nothing is lost. No timeout: cutting the promise short would abandon a write the SDK still completes once the connection returns
- [x] **BUG-027** ✅ DONE (PR #413) — saving a role change away from moderator now asks first, naming how many folders the user will lose and that promoting them back does not restore them
- [x] ~~Home page **create folder** button~~ **ปิดด้วยการลบ** (PR #395) — ปุ่ม `+` กดไม่ถึงอยู่แล้ว: `PageLayout` ส่ง `:allow-create` ต่อให้ `UnifiedSidebar` ซึ่ง render แค่ `AdminAccordion` ไม่เคย render `FolderSidebar` · Explorer สร้างโฟลเดอร์ได้จริงอยู่แล้ว จึงลบทั้งสาย prop/event/handler แทนที่จะต่อ
- [x] ~~Home page **share** button~~ ลบไปพร้อม Quick Share (2026-08-18, BUG-017)
- [x] ~~Explorer **folder creation dialog**~~ ลบพร้อมกัน (PR #395) — `handleCreateFolder` ใน `useDashboardPage` เป็น `console.log` ที่ไม่มีทางถูกเรียก
- [x] **Profile page** + nav ✅ **DONE** (PR #396) — `/profile` อ่านอย่างเดียว: ตัวตน, บทบาท, บริษัท, สถานะ, วันเข้าร่วม, กลุ่ม + โฟลเดอร์ที่ดูแล (moderator) · อ่าน `users/{uid}` ของตัวเอง + lookup companies/groups ซึ่งอยู่ในสิทธิ์ที่ rules ให้อยู่แล้ว
- [x] ~~**Settings page** + nav~~ **ปิดด้วยการลบ** (PR #396) — ยังไม่มีค่าอะไรให้ผู้ใช้ตั้ง (ธีม/ภาษา/แจ้งเตือน ไม่มีในระบบ) เมนูที่กดแล้วเงียบถูกเอาออก
- [x] **Dashboard view back button returns to origin** ✅ DONE (PR #328, #329) — `handleGoBack()` in `app/pages/dashboard/view/[id].vue` now uses `router.back()` when in-app history exists, falling back to `/dashboard/discover` on cold entry. Archive flow keeps the explicit push to Discover (previous listing is stale after archiving)
- [x] **Back-navigation cold-entry guard** ✅ DONE (PR #329, #330) — back handlers must test `window.history.state?.back` (the previous **in-app** entry, `null` on cold entry), not `window.history.length` (counts the whole tab, so a direct link opened after visiting another site navigated out of the app). Applied in `app/pages/dashboard/view/[id].vue` → `handleGoBack()` and `app/components/features/PermissionsPage.vue` → `goBackToExplorer()`. Use the same check for any new back button

---

## Current Implementation

### Pages (23 pages)

```
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

