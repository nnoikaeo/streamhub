# Component Architecture & Layout System

> **Purpose:** Component hierarchy, structure, and layout patterns for StreamHub
> **Strategy:** Strategy 4 (Hybrid Approach) using Pinia stores + composables
> **Current Implementation:** `app/components/` directory with 4-layer architecture
> **Last Updated:** 2026-02-13
> **Version:** 4.0 (Consolidated with Single Source of Truth)

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
│   └── QuickShareDialog
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
- `usePermissionsStore` - Permission checks and role-based access
- `useFolderStore` - Folder hierarchy and navigation

**Composables:**
- `useDashboardPage()` - Encapsulates dashboard page logic
- Permission-aware data loading (built into stores)

**Benefits:**
- State shared across app
- Permissions integrated at data level
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
│  └── AdminLayout.vue            # Admin panel layout
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
   └── AuditLog.vue
```

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Dashboard Discover Page** | Two-pane layout with folder sidebar | [dashboard-discover-page.md](wireframes/dashboard-discover-page.md) |
| **Dashboard View Page** | Two-pane layout with dashboard info | [dashboard-view-page.md](wireframes/dashboard-view-page.md) |
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
