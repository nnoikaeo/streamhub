# StreamHub Documentation

> **Last Updated:** 2026-03-22
> **Version:** 6.0 (Consolidated — Single Source of Truth)

---

## Quick Start

**New to StreamHub?** Read these 3 documents first:

1. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - 4-layer component system + Strategy 4 (Hybrid Approach)
2. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Single Source of Truth for RBAC
3. **[Database Schema](GUIDES/database-schema.md)** - Firestore collections + data model

---

## Documentation Map

```
docs/
│
├── README.md                          ← You are here (Single index)
│
├── GETTING-STARTED/                   ← Setup & onboarding
│   ├── installation.md                   npm install + env setup
│   ├── setup-firebase.md                 Firebase project config
│   └── first-deployment.md               First deploy guide
│
├── GUIDES/                            ← How things work (rules & logic)
│   ├── roles-and-permissions.md       ⭐ RBAC + Tag Permissions + Moderator Dual-View
│   ├── database-schema.md             ⭐ Firestore collections + setup (incl. Tags)
│   ├── PERMISSIONS_STORE.md              Permissions store API + examples
│   ├── authentication.md                 Auth flow (Google OAuth + Firebase)
│   └── company-management.md             Multi-company architecture
│
├── DESIGN/                            ← How things look (UI/UX)
│   ├── COMPONENT_ARCHITECTURE.md      ⭐ 4-layer system + Strategy 4 + Tag components + Auto-Import
│   ├── DESIGN_SYSTEM.md                  CSS tokens, colors, spacing, theme
│   ├── MOCK_DATA_STRUCTURE.md            Mock data for development
│   ├── user-flows.md                  ⭐ All role flows + Tag filtering
│   │
│   └── wireframes/                    ← Page wireframes (ASCII)
│       ├── sidebar-navigation.md         Role-based sidebar
│       ├── tag-management-page.md        Tag CRUD + Filter UI
│       ├── dashboard-discover-page.md    Dashboard browse page
│       ├── dashboard-view-page.md        Single dashboard view
│       ├── admin-explorer-page.md        Admin file explorer (replaces folder mgmt)
│       ├── admin-user-management-page.md
│       ├── admin-company-management-page.md
│       ├── admin-dashboard-home-page.md
│       ├── admin-permission-management-page.md
│       ├── admin-system-settings-page.md
│       └── moderator-quick-share-dialog.md
│
├── ARCHITECTURE/                      ← System architecture
│   ├── overview.md                       High-level architecture
│   ├── tech-stack.md                     Nuxt 4, Vue 3, Firebase, Pinia
│   ├── folder-structure.md               Project directory layout
│   └── data-flow.md                      Data flow patterns
│
├── OPERATIONS/                        ← Development lifecycle & plans
│   ├── roadmap.md                     ⭐ Development phases & progress
│   ├── deployment.md                     Firebase Hosting deploy
│   ├── versioning.md                     Versioning strategy
│   ├── company-access-control-plan.md    (Pending) Server-side access control
│   └── archive/                          ← Completed plans (historical reference)
│       ├── looker-studio-api-plan.md     (✅ Done) Looker Studio integration
│       └── user-invitations-plan.md      (✅ Done) Invitation system
│
├── CONTRIBUTING/                      ← Development standards
│   ├── workflow.md                       Git flow + branch strategy
│   ├── coding-standards.md               Code style + linting
│   └── code-review.md                    PR review process
│
├── REFERENCE/                         ← Quick lookups
│   └── environment-variables.md          .env variables
│
└── TROUBLESHOOTING/                   ← Problem solving
    ├── common-issues.md                  Known issues + fixes
    └── faq.md                            Frequently asked questions
```

**Total: 40 files** (consolidated from 59 — removed 19 redundant/deprecated/placeholder files)

---

## By Use Case

### "I need to understand the role/permission system"
1. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Role definitions, 3-layer access model, Tag permissions
2. **[Permissions Store](GUIDES/PERMISSIONS_STORE.md)** - `usePermissionsStore()` API + examples

### "I need to work on the Tag system"
1. **[Database Schema > Tags](GUIDES/database-schema.md#6-tags-collection)** - Tag data model + queries
2. **[Roles & Permissions > Tag Permissions](GUIDES/roles-and-permissions.md#-tag-permissions)** - Who can do what with tags
3. **[Tag Management Wireframe](DESIGN/wireframes/tag-management-page.md)** - Tag Filter + Selector + Manager UI

### "I want to create a new page"
1. **[Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md)** - Strategy 4 step-by-step guide + available components + auto-import conventions

### "I need to customize styling"
1. **[Design System](DESIGN/DESIGN_SYSTEM.md)** - CSS tokens, colors, spacing, theme variables

### "I want to understand the data model"
1. **[Database Schema](GUIDES/database-schema.md)** - All Firestore collections
2. **[Roles & Permissions](GUIDES/roles-and-permissions.md)** - Access control logic + Firestore rules

### "I want to see the development plan"
1. **[Roadmap](OPERATIONS/roadmap.md)** - All phases and progress tracking

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
│   ├── useTags()              ← Tag CRUD + filter         │
│   └── useRoleNavigation()    ← Sidebar by role           │
│       ↓                                                  │
│  Pinia Stores                                            │
│   ├── dashboard, auth, permissions                       │
│   └── tags                                               │
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
→ See [Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md) for full guide

---

## Single Source of Truth

Each topic has ONE authoritative document:

| Topic | Single Source | Notes |
|-------|-------------|-------|
| Roles & Permissions | [roles-and-permissions.md](GUIDES/roles-and-permissions.md) | All RBAC rules |
| Data Model | [database-schema.md](GUIDES/database-schema.md) | All Firestore collections + setup |
| Component System | [COMPONENT_ARCHITECTURE.md](DESIGN/COMPONENT_ARCHITECTURE.md) | Includes Strategy 4 |
| Styling | [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) | CSS tokens + theme |
| Development Progress | [roadmap.md](OPERATIONS/roadmap.md) | Phases + tracking |

---

**Last Updated:** 2026-03-22
