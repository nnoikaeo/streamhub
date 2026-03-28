# StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash (150+ employees)
**Strategy:** Iterative — Features → QA → Deploy
**Last Updated:** 2026-03-25

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
  - Breadcrumb navigation, Quick Share dialog
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
- [x] **Fullscreen mode** — expand embed to fullscreen, Esc to exit, default on open
- [x] **Breadcrumb Thai** — "Dashboard" → "แดชบอร์ด"
- [x] **Share button** — navigate to `/admin/permissions` (admin/moderator only)
- [x] **⋮ Dropdown menu** — Thai labels (แก้ไขข้อมูล / ดาวน์โหลด / เก็บถาวร), z-index fix, hover fix
- [x] **Go Back** — navigate to `/dashboard/discover` without folder filter
- [x] **Dropdown styling** — fixed global button CSS override (added `.menu-item` to exclusion list in `main.css`)

#### TODO (Dashboard View — ต้องทำต่อในอนาคต)

- [ ] **แก้ไขข้อมูล** — implement dialog สำหรับแก้ไข name/description/tags ของ dashboard
  - ไฟล์: `app/pages/dashboard/view/[id].vue` → `handleEditInfo()`
  - ควรเปิด modal form คล้าย `DashboardForm.vue` แต่ inline บน view page
- [ ] **ดาวน์โหลด** — implement export dashboard เป็น PDF หรือ screenshot
  - ไฟล์: `app/pages/dashboard/view/[id].vue` → `handleDownload()`
  - แนวทาง: ใช้ browser `window.print()` หรือ puppeteer API route
- [ ] **เก็บถาวร** — implement confirm dialog แล้ว archive/soft-delete dashboard
  - ไฟล์: `app/pages/dashboard/view/[id].vue` → `handleArchive()`
  - ต้องเพิ่ม `status: 'archived'` field ใน Dashboard type + API
  - เพิ่ม `isArchived` filter ใน discover page

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

### Phase 6: Enhancement & Polish ⏳ PENDING
**Goal:** UX improvements, real Firebase integration, deploy

- [ ] **Dashboard Lazy Loading** — Intersection Observer, 12 items/batch
- [ ] **Looker Embed Security Hardening** (P0 — Critical)
  - Server auth middleware (Firebase ID token verification)
  - Server-side permission check before returning embed URLs
  - CSP headers + referrer restriction
  - Signed/expiring embed URLs
- [ ] **Server-Side Company Access Control**
  - Middleware validation
  - API endpoint enforcement
  - Client-side guards (`useCompanyAccess`)
- [ ] **Real Firebase Integration** — replace mock API with Firestore
- [ ] **Cross-browser testing + performance optimization**
- [ ] **Deploy to Firebase Hosting**

**Plans:**
- [phase6-implementation-plan.md](phase6-implementation-plan.md) — **แผนงานรวม Phase 6** (15 tasks, เรียงตามความสำคัญ)
- [looker-embed-security-plan.md](looker-embed-security-plan.md) — Looker embed security hardening
- [company-access-control-plan.md](company-access-control-plan.md) — company access control
- [archive/user-invitations-plan.md](archive/user-invitations-plan.md) *(archived — completed)*

---

## Current Implementation

### Pages (14 pages)

```
app/pages/
├── index.vue                          Redirect
├── login.vue                          Google OAuth login
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
│   ├── companies/index.vue            Company CRUD
│   ├── dashboards/index.vue           Dashboard CRUD
│   ├── folders/index.vue              Folder CRUD
│   ├── groups/index.vue               Group CRUD
│   ├── invitations/index.vue          Invitation management
│   ├── regions/index.vue              Region CRUD
│   ├── tags/index.vue                 Tag CRUD
│   └── users/index.vue               User CRUD
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

### Composables (24 composables)

| Category | Composables |
|----------|-----------|
| **Admin CRUD (11)** | useAdminBreadcrumbs, useAdminCompanies, useAdminCrudPage, useAdminDashboards, useAdminFolders, useAdminGroups, useAdminInvitations, useAdminRegions, useAdminResource, useAdminTags, useAdminUsers |
| **Moderator (2)** | useModeratorFolders, useModeratorDashboards |
| **Core (11)** | useAppToast, useAuth, useCompanyAccess, useDashboardPage, useDashboardService, useExplorer, useForm, useJSONMockService, useLookerApi, useMockData, usePaginatedList, useRoleNavigation, useSidebarVisibility |

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
- [ ] Looker embed security hardening (auth middleware, CSP, signed URLs)
- [ ] Dashboard lazy loading (Intersection Observer)
- [ ] Performance: Page load < 2 seconds
- [x] Mobile responsive
- [ ] Replace mock API with real Firestore

---

## Related Documents

- [Roles & Permissions](../GUIDES/roles-and-permissions.md) — RBAC rules
- [Database Schema](../GUIDES/database-schema.md) — Firestore collections
- [Component Architecture](../DESIGN/COMPONENT_ARCHITECTURE.md) — 4-layer system

