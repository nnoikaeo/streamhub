# Component Architecture & Layout System

> **Purpose:** Component hierarchy, structure, and layout patterns for StreamHub
> **Strategy:** Strategy 4 (Hybrid Approach) using Pinia stores + composables
> **Current Implementation:** `app/components/` directory with 4-layer architecture
> **Last Updated:** 2026-03-14
> **Version:** 5.0 (Tag System + Role-Based Sidebar)

---

## 🎯 Core Principles

StreamHub uses a **4-layer component architecture**:

1. **Layout Components** (Foundation) - Page structure, headers, sidebars
2. **Composition Components** (Reusable Sections) - Combine layouts with features
3. **Feature Components** (Page-Specific) - Dashboard cards, folder sidebar, grids
4. **UI Components** (Building Blocks) - Buttons, cards, modals, forms

**Benefits:**
- ✅ Reusable across pages
- ✅ Single responsibility (each layer has clear purpose)
- ✅ Easy to test and maintain
- ✅ Consistent structure across app

---

## 🏗️ Component Hierarchy

```
StreamHub Application
│
├── Layout Components (Foundation)
│   ├── AppLayout
│   ├── AdminLayout
│   └── AuthLayout (future)
│
├── Composition Components (Reusable Sections)
│   ├── TwoPaneLayout
│   ├── DiscoverPageLayout
│   └── AdminPanelLayout
│
├── Feature Components (Page-Specific)
│   ├── DashboardViewHeader
│   ├── FolderSidebar
│   ├── DashboardGrid
│   ├── QuickShareDialog
│   ├── TagBadge              (NEW - display tag on dashboard cards)
│   ├── TagFilter             (NEW - tag chip filter on View All page)
│   ├── TagSelector           (NEW - add/remove tags on dashboard edit)
│   └── TagManager            (NEW - admin CRUD page for tags)
│
└── UI Components (Building Blocks)
    ├── Buttons, Cards, Modals
    ├── Forms, Inputs, Selects
    └── Alerts, Badges, Spinners
```

---

## 📐 Layer 1: Layout Components (Foundation)

### AppLayout
**File:** `app/components/layouts/AppLayout.vue`

**Purpose:** Standard application layout with fixed header/footer

**Props:**
- `showSidebar?: boolean` - Optional sidebar support

**Structure:**
```
┌─────────────────────────┐
│    <AppHeader>          │ Fixed
├─────────────────────────┤
│  <slot> Page Content    │ Scrollable
├─────────────────────────┤
│    <AppFooter>          │ Fixed
└─────────────────────────┘
```

**Usage:** All main application pages

---

### TwoPaneLayout
**File:** `app/components/compositions/TwoPaneLayout.vue`

**Purpose:** Generic two-pane composition (sidebar + main content)

**Props:**
- `sidebarWidth?: number` (default: 280)
- `showSidebar?: boolean` (default: true)
- `sidebarBg?: string` (default: #f9fafb)
- `mainBg?: string` (default: #ffffff)

**Slots:**
- `#sidebar` - Sidebar content
- `default` - Main content area

**Structure:**
```
┌──────────┬──────────────────┐
│          │                  │
│ Sidebar  │  Main Content    │
│ (Fixed)  │  (Scrollable)    │
│          │                  │
└──────────┴──────────────────┘
```

---

### DiscoverPageLayout
**File:** `app/components/compositions/DiscoverPageLayout.vue`

**Purpose:** Specialized composition for Dashboard Discover page

**Structure:** Combines AppLayout + TwoPaneLayout

**Usage:** See [dashboard-discover-page.md](wireframes/dashboard-discover-page.md)

---

### AdminLayout
**File:** `app/components/layouts/AdminLayout.vue`

**Purpose:** Admin panel layout with dark header and sidebar navigation

**Features:**
- Fixed dark header (#1f2937)
- Left sidebar navigation
- Right content area
- Desktop-only (Phase 1)

---

### AuthLayout (To Be Created)
**File:** `app/components/layouts/AuthLayout.vue` (future)

**Purpose:** Simple centered layout for authentication pages (login, register)

**Structure:** Centered form container with minimal navigation

---

## 🎨 Layer 2: Composition Components

Combine layout components with feature components for specific pages.

### AdminPanelLayout
**File:** `app/components/compositions/AdminPanelLayout.vue`

**Purpose:** Admin pages combining AdminLayout + TwoPaneLayout

**Usage Example:**
```vue
<CompositionAdminPanelLayout>
  <template #sidebar>
    <!-- Admin navigation -->
  </template>
  <!-- Admin content -->
</CompositionAdminPanelLayout>
```

---

## 🔧 Layer 3: Feature Components

Page-specific components for dashboard functionality.

### DashboardViewHeader
**File:** `app/components/features/DashboardViewHeader.vue`

**Purpose:** Header for dashboard view page with breadcrumb and actions

**Props:**
- `breadcrumbItems: BreadcrumbItem[]`
- `dashboardTitle: string`
- `creatorName: string`
- `updatedTime: Date`

---

### FolderSidebar
**File:** `app/components/features/FolderSidebar.vue`

**Purpose:** Hierarchical folder navigation with accordion behavior

**Props:**
- `folders: Folder[]` - Folder tree data
- `selectedFolderId: string`
- `allowSearch: boolean`
- `allowCreate: boolean`

**Features:**
- Smart collapse for 4-5 level deep hierarchies
- Search box to find folders
- Accordion expand/collapse behavior

**See:** [dashboard-discover-page.md - Smart Collapse logic](wireframes/dashboard-discover-page.md)

---

### DashboardGrid
**File:** `app/components/features/DashboardGrid.vue`

**Purpose:** Responsive grid display of dashboard cards

**Props:**
- `dashboards: Dashboard[]`
- `loading: boolean`
- `emptyMessage: string`

**Features:**
- Infinite scroll pagination
- Responsive grid (2-3 columns on desktop)
- Dashboard card with actions

---

### QuickShareDialog
**File:** `app/components/features/QuickShareDialog.vue`

**Purpose:** Modal dialog for moderators to share dashboards

**Props:**
- `dashboardId: string`
- `availableUsers: User[]`

**Features:**
- User search and multi-select
- Expiry date options
- Layer 1 Direct Access only

**See:** [moderator-quick-share-dialog.md](wireframes/moderator-quick-share-dialog.md)

---

### TagBadge
**File:** `app/components/features/TagBadge.vue`

**Purpose:** Display a tag chip on dashboard cards and detail pages

**Props:**
- `tag: Tag` - Tag data (name, color)
- `size?: 'sm' | 'md'` - Badge size (default: sm)
- `removable?: boolean` - Show ✕ remove button (for TagSelector)

**Features:**
- Color-coded chip with tag color at 15% opacity background
- Max 3 tags displayed + "+N more" overflow with tooltip

---

### TagFilter
**File:** `app/components/features/TagFilter.vue`

**Purpose:** Tag chip multi-select filter on Dashboard "View All" page

**Props:**
- `tags: Tag[]` - All available tags
- `selectedTags: string[]` - Currently selected tag IDs
- `loading?: boolean`

**Events:**
- `@update:selectedTags` - Emitted when tag selection changes

**Features:**
- Horizontal chip bar with toggle selection (outline/filled states)
- AND logic: selecting multiple tags filters for dashboards with ALL selected tags
- Click active tag to deselect

**See:** [tag-management-page.md > Tag Filter](wireframes/tag-management-page.md#1-tag-filter-all-roles--view-all-page)

---

### TagSelector
**File:** `app/components/features/TagSelector.vue`

**Purpose:** Add/remove tags when editing a dashboard (Moderator Manager + Admin)

**Props:**
- `dashboardId: string`
- `currentTags: string[]` - Currently assigned tag IDs
- `availableTags: Tag[]` - All tags to choose from

**Events:**
- `@update:tags` - Emitted when tags are added/removed

**Features:**
- Dropdown with search and checkbox selection
- Current tags shown as removable chips
- Moderator: select from existing tags only
- Admin: inline "Create new tag" option

**See:** [tag-management-page.md > Tag Assignment](wireframes/tag-management-page.md#2-tag-assignment-moderator-manager-mode--admin)

---

### TagManager
**File:** `app/components/features/TagManager.vue`

**Purpose:** Admin-only full CRUD management for tags

**Props:** None (uses useTagStore internally)

**Features:**
- Table view of all tags with name, color, dashboard count, status
- Create/Edit dialog with name, slug, color picker, description
- Delete confirmation with impact warning (shows affected dashboards)
- Search/filter tags

**See:** [tag-management-page.md > Tag Management](wireframes/tag-management-page.md#3-tag-management-page-admin-only)

---

## 🎛️ Layer 4: UI Components (Building Blocks)

Basic reusable components (buttons, cards, forms, etc.).

**Theme Classes Available:**
- `.theme-btn` / `.theme-btn--primary` / `.theme-btn--secondary`
- `.theme-card` / `.theme-card--primary`
- `.theme-modal` / `.theme-modal__header` / `.theme-modal__body`
- `.theme-form-group` / `.theme-form-label` / `.theme-form-input`
- `.theme-alert` / `.theme-badge` / `.theme-spinner`

**See:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete reference

---

## 🔐 State Management (Strategy 4)

**Pinia Stores:**
- `useDashboardStore` - Dashboard data and operations
- `usePermissionsStore` - Permission checks and role-based access (includes `canManageTags`, `canAssignTags`)
- `useFolderStore` - Folder hierarchy and navigation
- `useTagStore` - **(NEW)** Tag CRUD operations, caching, and dashboard-tag relationships

**Composables:**
- `useDashboardPage()` - Encapsulates dashboard page logic
- `useTags()` - **(NEW)** Tag CRUD logic, tag filtering, tag assignment to dashboards
- `useRoleNavigation()` - **(NEW)** Role-based sidebar menu generation (see [Sidebar Navigation](wireframes/sidebar-navigation.md))
- Permission-aware data loading (built into stores)

**Benefits:**
- State shared across app
- Permissions integrated at data level
- Tag filtering integrated with dashboard queries
- Role-based navigation generated from user role
- Easy to extend and test

---

## 📱 Responsive Design

**Desktop (>1024px):**
- Two-pane layout with full sidebar
- 2-3 column grid
- All navigation visible

**Tablet (768-1024px):**
- Collapsible sidebar
- 2 column grid
- Touch-friendly spacing

**Mobile (<768px):**
- Hamburger menu
- 1 column list
- Full-width content

**Details:** See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

---

## 📋 Component File Structure

```
app/components/
├── layouts/
│  ├── AppLayout.vue              # Standard layout
│  ├── AdminLayout.vue            # Admin panel layout
│  └── UnifiedSidebar.vue         # Role-based sidebar (uses useRoleNavigation)
│
├── ui/                           # Design system (reusable)
│  ├── Button.vue
│  ├── Card.vue
│  ├── Modal.vue
│  ├── Input.vue
│  ├── Select.vue
│  ├── Breadcrumb.vue
│  └── Badge.vue
│
├── compositions/                 # Composition patterns
│  ├── TwoPaneLayout.vue
│  ├── DiscoverPageLayout.vue
│  └── AdminPanelLayout.vue
│
└── features/                     # Domain-specific
   ├── DashboardCard.vue
   ├── DashboardGrid.vue
   ├── FolderSidebar.vue
   ├── FolderTree.vue
   ├── QuickShareDialog.vue
   ├── PermissionEditor.vue
   ├── AuditLog.vue
   ├── TagBadge.vue               # (NEW) Tag display chip
   ├── TagFilter.vue              # (NEW) Tag filter bar for View All page
   ├── TagSelector.vue            # (NEW) Tag add/remove in dashboard edit
   └── TagManager.vue             # (NEW) Admin tag CRUD page

app/composables/
├── ... existing ...
├── useTags.ts                    # (NEW) Tag CRUD + filtering logic
└── useRoleNavigation.ts          # (NEW) Role-based sidebar menu config

app/stores/
├── ... existing ...
└── tags.ts                       # (NEW) Tag store (Pinia)

app/types/
├── dashboard.ts                  # Updated: Dashboard.tags: string[]
├── admin.ts
└── tag.ts                        # (NEW) Tag interface
```

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Dashboard Discover Page** | Two-pane layout with folder sidebar | [dashboard-discover-page.md](wireframes/dashboard-discover-page.md) |
| **Dashboard View Page** | Two-pane layout with dashboard info | [dashboard-view-page.md](wireframes/dashboard-view-page.md) |
| **Sidebar Navigation** | Role-based sidebar wireframe | [sidebar-navigation.md](wireframes/sidebar-navigation.md) |
| **Tag Management Page** | Tag CRUD + filter + assignment UI | [tag-management-page.md](wireframes/tag-management-page.md) |
| **Admin Permissions** | Admin permission management page | [admin-permission-management-page.md](wireframes/admin-permission-management-page.md) |
| **Quick Share Dialog** | Moderator share dialog | [moderator-quick-share-dialog.md](wireframes/moderator-quick-share-dialog.md) |
| **Design System** | Colors, typography, spacing, components | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| **Theme Implementation** | CSS variables, utility classes, best practices | [THEME_IMPLEMENTATION.md](THEME_IMPLEMENTATION.md) |

---

## ✨ Key Differences from v3.x

- ✅ Consolidated from 1,448 lines (separate docs) to ~350 lines
- ✅ Merged LAYOUT_COMPONENTS.md content into COMPONENT_ARCHITECTURE.md
- ✅ Removed duplicate layout descriptions
- ✅ Removed verbose code examples
- ✅ Simplified to focus on structure and purpose
- ✅ Added cross-references (Single Source of Truth)
- ✅ Updated to match Strategy 4 implementation
- ✅ Removed implementation checklists and detailed phase-by-phase instructions

---

**Created:** 2024-01-25
**Updated:** 2026-02-13 (v4.0 - Consolidated & Merged)
**Designer:** Development Team
**Version:** 4.0
