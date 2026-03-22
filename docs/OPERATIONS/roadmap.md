# StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash (150+ employees)
**Strategy:** Iterative — Features → QA → Deploy
**Last Updated:** 2026-03-22

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
- [x] Regions collection + Admin management page
- [x] Groups collection + Admin management page
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
- [x] Tag Admin Page — `/admin/tags` + TagForm
- [x] Tag API — full CRUD (`server/api/mock/tags/`)
- [x] Sidebar Restructure — `useRoleNavigation`, UnifiedSidebar with role-based accordions
- [x] Moderator Dual-View:
  - `useModeratorFolders` + `useModeratorDashboards` composables
  - Manage Folders accordion in sidebar (FolderAccordion)
  - Moderator Explorer page (`/manage/explorer/[[folderId]]`)
  - DashboardForm with `showTagSelector` / `canCreateTag` / `availableTags`

---

### Phase 5: Looker Integration ⏳ PENDING
**Goal:** Connect Looker Studio + advanced features

- [ ] **Looker Studio Manual URL** — URL input + validation + live preview
- [ ] **Looker Studio API** (optional) — fetch available reports, sync metadata
- [ ] **Dashboard Preview Widget** — thumbnail, quick view modal

**Plan:** [looker-studio-api-plan.md](looker-studio-api-plan.md)

---

### Phase 6: Enhancement & Polish ⏳ PENDING
**Goal:** UX improvements, real Firebase integration, deploy

- [ ] **Dashboard "View All" Enhancement**
  - Tag filter chips on discover page
  - Folder dropdown filter
  - Lazy load (Intersection Observer, 12 items/batch)
  - Group dashboards by folder
- [ ] **Server-Side Company Access Control**
  - Middleware validation
  - API endpoint enforcement
  - Client-side guards (`useCompanyAccess`)
- [ ] **Real Firebase Integration** — replace mock API with Firestore
- [ ] **Cross-browser testing + performance optimization**
- [ ] **Deploy to Firebase Hosting**

**Plans:**
- [company-access-control-plan.md](company-access-control-plan.md)
- [user-invitations-plan.md](user-invitations-plan.md)

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
│   └── view.vue                       Single dashboard view
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

### Composables (22 composables)

| Category | Composables |
|----------|-------------|
| **Admin CRUD (11)** | useAdminBreadcrumbs, useAdminCompanies, useAdminCrudPage, useAdminDashboards, useAdminFolders, useAdminGroups, useAdminInvitations, useAdminRegions, useAdminResource, useAdminTags, useAdminUsers |
| **Moderator (2)** | useModeratorFolders, useModeratorDashboards |
| **Core (9)** | useAuth, useCompanyAccess, useDashboardPage, useDashboardService, useExplorer, useForm, useJSONMockService, useMockData, usePaginatedList, useRoleNavigation, useSidebarVisibility |

### Mock API Endpoints

All entities have REST endpoints under `server/api/mock/`:
- **Companies** — GET, POST, DELETE
- **Dashboards** — GET, POST, GET/:id, DELETE/:id
- **Folders** — GET, POST, GET/:id, DELETE/:id
- **Groups** — GET, POST, DELETE/:id
- **Invitations** — GET, POST, PUT/:id, DELETE/:id, verify, accept, bulk, reactivate, check
- **Regions** — GET, POST, DELETE/:code
- **Tags** — GET, POST, GET/:id, PUT/:id, DELETE/:id
- **Users** — GET, POST, GET/:uid, PUT/:uid, DELETE/:uid

### Mock Data (`.data/`)

9 JSON files: audit-log, companies, dashboards, folders, groups, invitations, regions, tags, users

---

## Success Criteria

- [ ] All 150 users can login with Google OAuth
- [x] Users Management functional (CRUD + invitations)
- [x] Dashboard Management working (CRUD + permissions)
- [ ] Looker Studio embeds display correctly (mock only currently)
- [x] Role-based access control working (permissions store)
- [x] Tag system: Admin CRUD, Moderator assign, User filter
- [x] Sidebar navigation: role-based menus
- [x] Moderator dual-view: Viewer mode + Manager mode
- [ ] Dashboard "View All": tag filter + folder filter + lazy load
- [ ] Performance: Page load < 2 seconds
- [x] Mobile responsive
- [ ] Replace mock API with real Firestore

---

## Related Documents

- [Roles & Permissions](../GUIDES/roles-and-permissions.md) — RBAC rules
- [Database Schema](../GUIDES/database-schema.md) — Firestore collections
- [Component Architecture](../DESIGN/COMPONENT_ARCHITECTURE.md) — 4-layer system

