---
title: Folder Structure
version: 2.0
updated: 2026-03-23
---

# Folder Structure

Understanding how files are organized in StreamHub.

## Directory Tree

```
streamhub/
│
├── 📁 app/                          # Nuxt application
│   │
│   ├── 📁 composables/              # Vue 3 composables (business logic)
│   │   ├── useAdminBreadcrumbs.ts   # Breadcrumb navigation for admin pages
│   │   ├── useAdminCompanies.ts     # Company CRUD
│   │   ├── useAdminCrudPage.ts      # Generic CRUD page state + toast integration
│   │   ├── useAdminDashboards.ts    # Dashboard CRUD
│   │   ├── useAdminFolders.ts       # Folder CRUD + tree building
│   │   ├── useAdminGroups.ts        # Group CRUD
│   │   ├── useAdminInvitations.ts   # Invitation management
│   │   ├── useAdminRegions.ts       # Region CRUD
│   │   ├── useAdminResource.ts      # Generic REST resource (base for all admin composables)
│   │   ├── useAdminTags.ts          # Tag CRUD (wraps useAdminResource + syncs tag store)
│   │   ├── useAdminUsers.ts         # User CRUD
│   │   ├── useAppToast.ts           # Centralized toast notifications (useState singleton)
│   │   ├── useAuth.ts               # Authentication (Firebase + Pinia)
│   │   ├── useCompanyAccess.ts      # Company-scoped access control
│   │   ├── useDashboardPage.ts      # Dashboard page state
│   │   ├── useDashboardService.ts   # Dashboard service interface + mock implementation
│   │   ├── useExplorer.ts           # Folder/dashboard explorer state
│   │   ├── useForm.ts               # Generic form state + validation
│   │   ├── useJSONMockService.ts    # JSON-based mock data service
│   │   ├── useLookerApi.ts          # Looker Studio API client (status, reports, sync)
│   │   ├── useMockData.ts           # Static mock data (users, folders, dashboards)
│   │   ├── useModeratorDashboards.ts # Moderator dashboard management
│   │   ├── useModeratorFolders.ts   # Moderator folder management
│   │   ├── usePaginatedList.ts      # Pagination logic
│   │   ├── useRoleNavigation.ts     # Role-based sidebar menu config
│   │   └── useSidebarVisibility.ts  # Sidebar show/hide state
│   │
│   ├── 📁 components/               # Reusable Vue components
│   │   ├── ErrorDialog.vue          # Global error dialog
│   │   │
│   │   ├── 📁 admin/
│   │   │   ├── 📁 forms/            # Admin form components
│   │   │   │   ├── CompanyForm.vue
│   │   │   │   ├── DashboardForm.vue
│   │   │   │   ├── FolderForm.vue
│   │   │   │   ├── GroupForm.vue
│   │   │   │   ├── TagForm.vue
│   │   │   │   └── UserForm.vue
│   │   │   └── RegionForm.vue
│   │   │
│   │   ├── 📁 compositions/         # Composition patterns (multi-slot layouts)
│   │   │   ├── AdminPageContent.vue # Admin page header + filters + table slots
│   │   │   ├── DataTable.vue        # Generic sortable data table
│   │   │   ├── FormModal.vue        # Generic form modal wrapper
│   │   │   ├── ConfirmDialog.vue    # Confirmation dialog
│   │   │   └── PageLayout.vue       # Standard two-pane page layout
│   │   │
│   │   ├── 📁 dashboard/            # Dashboard-specific components
│   │   │   ├── QuickActions.vue     # Dashboard homepage quick action buttons
│   │   │   ├── RecentDashboards.vue # Recently viewed dashboards list
│   │   │   └── StatCard.vue         # Stats card for admin/moderator overview
│   │   │
│   │   ├── 📁 features/             # Feature components
│   │   │   ├── DashboardCard.vue    # Dashboard card with preview thumbnail + hover overlay
│   │   │   ├── DashboardGrid.vue    # Responsive dashboard grid
│   │   │   ├── DashboardHeader.vue  # Dashboard discover page header
│   │   │   ├── DashboardPreview.vue # Quick view modal with live Looker iframe
│   │   │   ├── DashboardViewHeader.vue # Top nav for dashboard view (breadcrumb + actions)
│   │   │   ├── FolderSidebar.vue    # Folder tree sidebar for discover page
│   │   │   ├── FolderTree.vue       # Recursive folder tree component
│   │   │   ├── LookerUrlInput.vue   # Looker Studio URL input + validation + live preview
│   │   │   ├── PermissionEditor.vue # 3-layer permission editor UI
│   │   │   ├── QuickShareDialog.vue # Quick share modal
│   │   │   ├── TagBadge.vue         # Tag chip display
│   │   │   ├── TagFilter.vue        # Tag filter bar
│   │   │   └── TagSelector.vue      # Multi-tag selector input
│   │   │
│   │   ├── 📁 layouts/              # Layout components
│   │   │   └── UnifiedSidebar.vue   # Role-based sidebar (uses useRoleNavigation)
│   │   │
│   │   └── 📁 ui/                   # Design system (global, no prefix)
│   │       └── AppToast.vue         # Global toast notifications (Teleport + TransitionGroup)
│   │
│   ├── 📁 layouts/
│   │   ├── auth.vue                 # Auth page layout (centered card)
│   │   └── default.vue              # Main app layout (sidebar + content)
│   │
│   ├── 📁 middleware/
│   │   ├── admin.ts                 # Admin-only route guard
│   │   └── auth.ts                  # Auth route protection
│   │
│   ├── 📁 pages/
│   │   ├── index.vue                # Redirect to dashboard/discover
│   │   ├── login.vue                # Google OAuth login
│   │   │
│   │   ├── 📁 admin/
│   │   │   ├── index.vue            # Admin redirect
│   │   │   ├── overview.vue         # Admin dashboard overview
│   │   │   ├── permissions.vue      # Permission editor (3-layer)
│   │   │   ├── 📁 companies/
│   │   │   ├── 📁 dashboards/
│   │   │   ├── 📁 folders/
│   │   │   ├── 📁 groups/           # Group CRUD + sortOrder reordering
│   │   │   ├── 📁 invitations/
│   │   │   ├── 📁 regions/          # Region CRUD + sortOrder reordering
│   │   │   ├── 📁 tags/             # Tag CRUD + sortOrder reordering
│   │   │   └── 📁 users/
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   ├── index.vue            # Dashboard home
│   │   │   ├── discover.vue         # Browse all dashboards
│   │   │   └── 📁 view/
│   │   │       └── [id].vue         # Single dashboard view (dynamic route, Looker embed)
│   │   │
│   │   ├── 📁 manage/
│   │   │   ├── permissions.vue      # Moderator permission editor
│   │   │   └── 📁 explorer/         # Moderator folder explorer
│   │   │
│   │   └── 📁 invite/
│   │       └── accept.vue           # Invitation acceptance page
│   │
│   ├── 📁 plugins/
│   │   └── firebase.ts              # Firebase initialization
│   │
│   ├── 📁 stores/
│   │   ├── auth.ts                  # Auth state + user session (Pinia)
│   │   ├── dashboard.ts             # Dashboard state management
│   │   ├── permissions.ts           # Role-based permissions (canManageTags, etc.)
│   │   └── tags.ts                  # Tag CRUD + caching
│   │
│   ├── 📁 types/
│   │   ├── admin.ts                 # Region, Company, AdminGroup types
│   │   ├── dashboard.ts             # User, Folder, Dashboard, Permission types
│   │   ├── invitation.ts            # Invitation types
│   │   └── tag.ts                   # Tag interface
│   │
│   ├── 📁 utils/
│   │   ├── errorMessages.ts         # Centralized error message strings
│   │   ├── firebase.ts              # Firebase config + initialization
│   │   ├── formValidators.ts        # Form validation helpers
│   │   ├── lookerUrl.ts             # Looker Studio URL validation + embed URL conversion
│   │   └── schemas.ts               # Zod validation schemas
│   │
│   └── app.vue                      # Root component (mounts AppToast globally)
│
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── main.css                 # Global styles
│   │   └── theme.css                # CSS variable definitions (design tokens)
│   └── 📁 images/
│
├── 📁 .data/                        # Mock JSON data (runtime, gitignored in prod)
│   ├── audit-log.json
│   ├── companies.json
│   ├── dashboards.json
│   ├── folders.json
│   ├── groups.json
│   ├── invitations.json
│   ├── regions.json
│   ├── tags.json
│   └── users.json
│
├── 📁 server/
│   └── 📁 api/
│       ├── 📁 looker/               # Looker Studio API proxy endpoints
│       │   ├── reports.get.ts       # List all Looker reports
│       │   ├── status.get.ts        # Check Looker API credentials status
│       │   ├── sync.post.ts         # Sync dashboard metadata from Looker
│       │   └── 📁 reports/
│       │       └── [id].get.ts      # Get single Looker report by ID
│       ├── 📁 thumbnail/            # Dashboard thumbnail generation
│       │   └── [dashboardId].get.ts # Generate SVG placeholder thumbnail
│       └── 📁 mock/                 # Nitro mock API handlers
│           ├── companies/
│           ├── dashboards/
│           ├── folders/
│           ├── groups/
│           ├── invitations/
│           ├── regions/
│           ├── tags/
│           └── users/
│
├── 📁 docs/                         # 📖 Documentation
│   ├── README.md                    # Documentation index
│   ├── ARCHITECTURE/
│   ├── CONTRIBUTING/
│   ├── DESIGN/
│   ├── GETTING-STARTED/
│   ├── GUIDES/
│   ├── OPERATIONS/
│   ├── REFERENCE/
│   └── TROUBLESHOOTING/
│
├── 📁 public/
│   └── robots.txt
│
├── 📄 nuxt.config.ts                # Nuxt configuration
├── 📄 tailwind.config.ts            # Tailwind + design tokens
├── 📄 tsconfig.json                 # TypeScript config
└── 📄 package.json                  # Dependencies + scripts
```

---

## Directory Purposes

### `/app` - Nuxt Application

| Folder | Purpose |
|--------|---------|
| `composables/` | Vue 3 Composition functions (logic reuse) |
| `components/` | Reusable Vue components |
| `layouts/` | Page wrapper layouts |
| `middleware/` | Route guards & protection |
| `pages/` | Application pages (auto-routing) |
| `plugins/` | Initialize plugins (Firebase, etc.) |
| `stores/` | Pinia state management |
| `utils/` | Helper functions, constants |

### `/assets` - Static Assets

- Global CSS
- Images
- Icons
- Fonts

### `/docs` - Documentation

See [Documentation Structure](../README.md) for details.

### `/public` - Static Files

Served as-is, no processing:
- `favicon.ico`
- `robots.txt`
- `sitemap.xml` (future)

---

## Key Files Explained

### `app.vue`
- Root Vue component
- Wraps all pages
- Initialize app-level logic

### `nuxt.config.ts`
- Nuxt configuration
- Module imports
- Build settings
- Runtime config

### `package.json`
- Dependencies list
- Script commands
- Project metadata

### `.env`
- Secret credentials (⚠️ gitignored)
- Never commit this file!

### `.env.example`
- Template for `.env`
- Shows required variables
- **Commit this file!**

### `.gitignore`
- Files not tracked by Git
- Dependencies, builds, secrets

### `tsconfig.json`
- TypeScript compiler options
- Path aliases (`~` = root)

---

## Auto-Generated Folders (Gitignored)

### `.nuxt/`
- Dev build artifacts
- Auto-generated types
- Re-created on `npm run dev`

### `.output/`
- Production build
- Created by `npm run build`
- Deployed to Firebase Hosting

### `node_modules/`
- Installed dependencies
- Large (1000+ files)
- Always gitignored

---

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `DataTable.vue`)
- **Pages:** kebab-case for multi-word (e.g., `accept.vue`, `discover.vue`)
- **Composables:** camelCase with `use` prefix (e.g., `useAdminGroups.ts`)
- **Stores:** camelCase, named by domain (e.g., `auth.ts`, `permissions.ts`)
- **Utilities:** camelCase (e.g., `errorMessages.ts`)

### Folders
- **Parent:** PascalCase (e.g., `GETTING-STARTED/`)
- **Nested:** kebab-case (e.g., `user-management/`)

---

## File Relationships

```
pages/login.vue
    ↓
uses middleware auth.ts
uses composable useAuth.ts
    ↓
uses store auth.ts
    ↓
uses plugin firebase.ts
    ↓
uses util firebase.ts (config)
```

---

## Adding New Features

Example: Adding "Users" page

```bash
# 1. Create page
touch app/pages/dashboard/users.vue

# 2. Create composable (if needed)
touch app/composables/useUsers.ts

# 3. Add store (if needed)
touch app/stores/users.ts

# 4. Create component (if needed)
mkdir -p app/components/Users
touch app/components/Users/UserCard.vue

# 5. Add guide
touch docs/GUIDES/users-feature.md
```

---

## Best Practices

✅ **DO:**
- Keep components focused & small
- Use composables for logic reuse
- Store in Pinia for global state
- Document new files

❌ **DON'T:**
- Put logic in components
- Create deeply nested folders
- Use app.vue for page content
- Ignore TypeScript errors

---

## See Also

- [Architecture Overview](overview.md)
- [Tech Stack Details](tech-stack.md)
- [Contributing Guide](../CONTRIBUTING/workflow.md)
