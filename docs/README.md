# StreamHub Documentation

> **Last Updated:** 2026-03-14
> **Version:** 5.0 (Tag System + Role-Based Sidebar + Moderator Dual-View)

---

## Quick Start

**New to StreamHub?** Read these 3 documents first:

1. **[Strategy 4: Hybrid Approach](ARCHITECTURE/STRATEGY_4_HYBRID_APPROACH.md)** - Page architecture (Pinia + Composables)
2. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Single Source of Truth for RBAC
3. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - 4-layer component system

---

## Documentation Map

```
docs/
│
├── README.md                          ← You are here
│
├── GUIDES/                            ← How things work (rules & logic)
│   ├── roles-and-permissions.md       ⭐ RBAC + Tag Permissions + Moderator Dual-View
│   ├── database-schema.md             ⭐ Firestore collections (incl. Tags)
│   ├── PERMISSIONS_STORE.md              Permissions store API + examples
│   ├── authentication.md                 Auth flow (Google OAuth + Firebase)
│   ├── company-management.md             Multi-company setup
│   ├── firestore-setup.md                Firestore configuration
│   ├── components.md                     Component usage guide
│   └── testing.md                        Testing guide
│
├── DESIGN/                            ← How things look (UI/UX)
│   ├── COMPONENT_ARCHITECTURE.md      ⭐ 4-layer system + Tag components
│   ├── COMPONENT_CONVENTIONS.md          Component naming + auto-import
│   ├── DESIGN_SYSTEM.md                  CSS tokens, colors, spacing
│   ├── THEME_IMPLEMENTATION.md           Theme CSS variables
│   ├── user-flows.md                  ⭐ All role flows + Tag filtering
│   ├── MOCK_DATA_STRUCTURE.md            Mock data for development
│   ├── AUTH_MIDDLEWARE_TEST_PLAN.md       Auth middleware testing
│   │
│   └── wireframes/                    ← Page wireframes (ASCII)
│       ├── sidebar-navigation.md      ⭐ Role-based sidebar (NEW)
│       ├── tag-management-page.md     ⭐ Tag CRUD + Filter UI (NEW)
│       ├── dashboard-discover-page.md    Dashboard browse page
│       ├── dashboard-view-page.md        Single dashboard view
│       ├── admin-explorer-page.md        Admin file explorer
│       ├── admin-user-management-page.md
│       ├── admin-company-management-page.md
│       ├── admin-folder-management-page.md
│       ├── admin-dashboard-home-page.md
│       ├── admin-permission-management-page.md
│       ├── admin-system-settings-page.md
│       └── moderator-quick-share-dialog.md
│
├── ARCHITECTURE/                      ← System architecture
│   ├── overview.md                       High-level architecture
│   ├── tech-stack.md                     Nuxt 3, Vue 3, Firebase, Pinia
│   ├── folder-structure.md               Project directory layout
│   ├── data-flow.md                      Data flow patterns
│   └── STRATEGY_4_HYBRID_APPROACH.md     Page architecture (Pinia + Composables)
│
├── OPERATIONS/                        ← Development lifecycle
│   ├── roadmap.md                     ⭐ Phase 5: Tag System + Sidebar Restructure
│   ├── deployment.md                     Firebase Hosting deploy
│   ├── monitoring.md                     Performance monitoring
│   └── versioning.md                     Versioning strategy
│
├── GETTING-STARTED/                   ← Setup & onboarding
│   ├── installation.md                   npm install + env setup
│   ├── setup-firebase.md                 Firebase project config
│   └── first-deployment.md               First deploy guide
│
├── CONTRIBUTING/                      ← Development standards
│   ├── coding-standards.md               Code style + linting
│   ├── code-review.md                    PR review process
│   └── workflow.md                       Git flow + branch strategy
│
├── REFERENCE/                         ← Quick lookups
│   ├── firestore-collections.md          Collection quick reference
│   └── environment-variables.md          .env variables
│
└── TROUBLESHOOTING/                   ← Problem solving
    ├── common-issues.md                  Known issues + fixes
    └── faq.md                            Frequently asked questions
```

---

## By Use Case

### "I need to understand the role/permission system"
1. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Role definitions, 3-layer access model, Tag permissions
2. **[Moderator Dual-View](GUIDES/roles-and-permissions.md#-moderator-dual-view-model)** - How Moderator switches between Viewer/Manager mode
3. **[Permissions Store](GUIDES/PERMISSIONS_STORE.md)** - `usePermissionsStore()` API + examples

### "I need to work on the Tag system"
1. **[Database Schema > Tags](GUIDES/database-schema.md#6-tags-collection)** - Tag data model + queries
2. **[Tag Permissions](GUIDES/roles-and-permissions.md#-tag-permissions)** - Who can do what with tags
3. **[Tag Management Wireframe](DESIGN/wireframes/tag-management-page.md)** - Tag Filter + Selector + Manager UI
4. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - TagBadge, TagFilter, TagSelector, TagManager

### "I need to work on the Sidebar"
1. **[Sidebar Navigation Wireframe](DESIGN/wireframes/sidebar-navigation.md)** - Role-based sidebar design
2. **[User Flows](DESIGN/user-flows.md)** - How each role navigates
3. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - UnifiedSidebar + useRoleNavigation

### "I want to create a new page"
1. **[Strategy 4: Hybrid Approach](ARCHITECTURE/STRATEGY_4_HYBRID_APPROACH.md)** - Step-by-step guide
2. **[Component Conventions](DESIGN/COMPONENT_CONVENTIONS.md)** - Layer structure + naming
3. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - Available components

### "I need to customize styling"
1. **[Design System](DESIGN/DESIGN_SYSTEM.md)** - CSS tokens, colors, spacing
2. **[Theme Implementation](DESIGN/THEME_IMPLEMENTATION.md)** - CSS variables + utility classes

### "I want to understand the data model"
1. **[Database Schema](GUIDES/database-schema.md)** - All Firestore collections (companies, users, folders, dashboards, invitations, tags)
2. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Access control logic + Firestore rules

### "I want to see the development plan"
1. **[Roadmap](OPERATIONS/roadmap.md)** - All phases including Phase 5 (Tag System + Sidebar)
2. **[User Flows](DESIGN/user-flows.md)** - What we're building for each role

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   StreamHub Application                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Pages (discover, view, admin/*, manage/*)               │
│       ↓                                                  │
│  Composables                                             │
│   ├── useDashboardPage()                                 │
│   ├── useTags()              ← NEW: Tag CRUD + filter    │
│   └── useRoleNavigation()    ← NEW: Sidebar by role      │
│       ↓                                                  │
│  Pinia Stores                                            │
│   ├── dashboard, auth, permissions                       │
│   └── tags                   ← NEW: Tag store            │
│       ↓                                                  │
│  Components (4-layer)                                    │
│   ├── Layouts    (AppLayout, UnifiedSidebar)             │
│   ├── Compositions (TwoPaneLayout, AdminPanelLayout)     │
│   ├── Features   (DashboardGrid, TagFilter, TagBadge...) │
│   └── UI         (Button, Card, Modal, Badge...)         │
│       ↓                                                  │
│  CSS Variables (Design System)                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Roles (3 types)
| Role | Sidebar | Key Capabilities |
|---|---|---|
| **User** | Dashboard (View All, Search) | View dashboards, filter by tag/folder |
| **Moderator** | Dashboard + Manage Folders | Dual-view: Viewer (read-only) + Manager (CRUD in assigned folders, assign tags) |
| **Admin** | Dashboard + Admin (all menus) | Full access + Tag CRUD + User management |

### Folder + Tag Model
- **Folder** = physical location (1 dashboard in 1 folder)
- **Tag** = logical grouping (1 dashboard has many tags, many-to-many)
- Admin manages both; Moderator manages folders (assigned) + assigns tags; User filters by both

### Strategy 4: Hybrid Approach
Recommended pattern for all new pages: **Layouts + Pinia Stores + Composables + Permissions**

---

## Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| GUIDES/roles-and-permissions.md | Updated (v4.0 + Tag + Dual-View) | 2026-03 |
| GUIDES/database-schema.md | Updated (v3.0 + Tags Collection) | 2026-03 |
| GUIDES/PERMISSIONS_STORE.md | Updated (canManageTags/canAssignTags) | 2026-03 |
| DESIGN/user-flows.md | Updated (Tag filter + Moderator Dual-View) | 2026-03 |
| DESIGN/COMPONENT_ARCHITECTURE.md | Updated (v5.0 + Tag components) | 2026-03 |
| DESIGN/wireframes/sidebar-navigation.md | **New** | 2026-03 |
| DESIGN/wireframes/tag-management-page.md | **New** | 2026-03 |
| OPERATIONS/roadmap.md | Updated (Phase 5 added) | 2026-03 |
| ARCHITECTURE/STRATEGY_4_HYBRID_APPROACH.md | Current (moved from root) | 2025-02 |
| DESIGN/COMPONENT_CONVENTIONS.md | Current (moved from root) | 2025-02 |
| DESIGN/DESIGN_SYSTEM.md | Current | 2025-02 |

---

**Last Updated:** 2026-03-14
