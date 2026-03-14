# Sidebar Navigation Wireframe (Role-Based)

> **Purpose:** Role-based sidebar navigation design for StreamHub
> **Related:** [User Flows](../user-flows.md), [Roles & Permissions](../../GUIDES/roles-and-permissions.md)
> **Last Updated:** 2026-03
> **Version:** 1.0

---

## Overview

Sidebar navigation is **role-based** — each role sees different menu structures.
All roles share the **Dashboard** menu (View All + Search) as the primary entry point.

**Key Design Decisions:**
- Folder Tree is **removed from Sidebar** for User and Moderator — replaced by Folder Filter dropdown on the "View All" page
- Moderator has **2 menu groups**: Dashboard (Viewer) + Manage Folders (Manager)
- Admin keeps **Folder Tree in Explorer** (left panel) for structural management
- Sidebar uses **mutually exclusive accordions** (one group open at a time)

---

## 1. USER Role Sidebar

```
┌──────────────────────┐
│                      │
│  ▾ Dashboard         │  ← Always open by default
│    ├ View All        │  → /dashboard/discover?view=all
│    └ Search          │  → /dashboard/discover?mode=search
│                      │
│  (No Folder Tree)    │
│  (No Admin menu)     │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
└──────────────────────┘
```

**Behavior:**
- "View All" → Opens Dashboard Discover page with all accessible dashboards, grouped by folder, with tag filter chips and folder dropdown filter
- "Search" → Opens Dashboard Discover page with search input focused
- No Folder Tree in sidebar (folders are used as filters on the discover page)
- Sidebar is minimal and clean

**Active State:**
- Current menu item highlighted with primary color background
- `/dashboard/discover` → "View All" highlighted
- `/dashboard/view/:id` → no sidebar item highlighted (breadcrumb shows path)

---

## 2. MODERATOR Role Sidebar

```
┌──────────────────────┐
│                      │
│  ▾ Dashboard         │  ← View 1: Viewer Mode
│    ├ View All        │  → /dashboard/discover?view=all
│    └ Search          │  → /dashboard/discover?mode=search
│                      │
│  ▾ Manage Folders    │  ← View 2: Manager Mode
│    ├ 📁 Sales    (2) │  → /manage/folders/folder_sales
│    │  ├ Q1           │  → /manage/folders/folder_q1
│    │  └ Q2           │  → /manage/folders/folder_q2
│    └ 📁 Finance  (1) │  → /manage/folders/folder_finance
│      └ Budget        │  → /manage/folders/folder_budget
│                      │
│  (No Admin menu)     │
│                      │
│                      │
│                      │
└──────────────────────┘
```

**Behavior:**
- **Dashboard group** = Viewer mode (read-only, same as User)
- **Manage Folders group** = Manager mode (CRUD in assigned folders)
- Manage Folders shows **only `assignedFolders`** — not all folders
- Folder tree under "Manage Folders" shows subfolder hierarchy with dashboard count badges
- Clicking a folder opens the management page for that folder
- Accordions are **mutually exclusive**: opening "Manage Folders" closes "Dashboard" and vice versa

**Active State:**
- `/dashboard/discover` → "View All" highlighted, Dashboard accordion open
- `/manage/folders/folder_sales` → "Sales" highlighted, Manage Folders accordion open

**Visual Indicators:**
- ✏️ icon next to assigned folder names (to indicate manageable)
- Badge with dashboard count `(2)` next to folder names
- Indented subfolders with tree lines

---

## 3. ADMIN Role Sidebar

```
┌──────────────────────┐
│                      │
│  ▾ Dashboard         │  ← Same as User/Moderator
│    ├ View All        │  → /dashboard/discover?view=all
│    └ Search          │  → /dashboard/discover?mode=search
│                      │
│  ▾ Admin             │  ← Admin-only menu
│    ├ Overview        │  → /admin/overview
│    ├ Users           │  → /admin/users
│    ├ Explorer        │  → /admin/explorer
│    ├ Dashboards      │  → /admin/dashboards
│    ├ Companies       │  → /admin/companies
│    ├ Groups          │  → /admin/groups
│    ├ Tags            │  → /admin/tags  (NEW)
│    └ Permissions     │  → /admin/permissions
│                      │
│  (No Folder Tree     │
│   in Sidebar —       │
│   Explorer has its   │
│   own Folder Tree    │
│   in left panel)     │
│                      │
└──────────────────────┘
```

**Behavior:**
- **Dashboard group** = Same view as User (tag filter + folder filter + lazy load)
- **Admin group** = Full admin panel with all management pages
- **Tags** = New menu item for tag CRUD management
- **Explorer** = Has its own Folder Tree in the left panel (not duplicated in sidebar)
- Accordions are **mutually exclusive**: opening Admin closes Dashboard and vice versa

**Active State:**
- `/admin/tags` → "Tags" highlighted, Admin accordion open
- `/admin/explorer/folder_sales` → "Explorer" highlighted, Admin accordion open

---

## 4. Sidebar Visibility Logic

```typescript
// composable: useRoleNavigation()

interface SidebarMenuGroup {
  id: string
  label: string
  icon: string
  items: SidebarMenuItem[]
  visible: boolean           // Role-based visibility
}

interface SidebarMenuItem {
  label: string
  icon: string
  to: string                 // Route path
  badge?: number             // Item count badge
  children?: SidebarMenuItem[]
}

function getSidebarMenus(role: string, assignedFolders: Folder[]): SidebarMenuGroup[] {
  const menus: SidebarMenuGroup[] = []

  // Dashboard menu — ALL roles
  menus.push({
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    visible: true,
    items: [
      { label: 'View All', icon: 'grid_view', to: '/dashboard/discover?view=all' },
      { label: 'Search', icon: 'search', to: '/dashboard/discover?mode=search' },
    ]
  })

  // Manage Folders menu — MODERATOR only
  if (role === 'moderator') {
    menus.push({
      id: 'manage-folders',
      label: 'Manage Folders',
      icon: 'folder_managed',
      visible: true,
      items: assignedFolders.map(folder => ({
        label: folder.name,
        icon: 'folder',
        to: `/manage/folders/${folder.id}`,
        badge: folder.dashboardCount,
        children: folder.children?.map(sub => ({
          label: sub.name,
          icon: 'folder_open',
          to: `/manage/folders/${sub.id}`,
        }))
      }))
    })
  }

  // Admin menu — ADMIN only
  if (role === 'admin') {
    menus.push({
      id: 'admin',
      label: 'Admin',
      icon: 'admin_panel_settings',
      visible: true,
      items: [
        { label: 'Overview', icon: 'analytics', to: '/admin/overview' },
        { label: 'Users', icon: 'people', to: '/admin/users' },
        { label: 'Explorer', icon: 'folder_copy', to: '/admin/explorer' },
        { label: 'Dashboards', icon: 'dashboard', to: '/admin/dashboards' },
        { label: 'Companies', icon: 'business', to: '/admin/companies' },
        { label: 'Groups', icon: 'groups', to: '/admin/groups' },
        { label: 'Tags', icon: 'label', to: '/admin/tags' },
        { label: 'Permissions', icon: 'lock', to: '/admin/permissions' },
      ]
    })
  }

  return menus
}
```

---

## 5. Responsive Behavior

### Desktop (>1024px)
```
┌──────────────────┬──────────────────────────────────────┐
│                  │                                      │
│     SIDEBAR      │          MAIN CONTENT                │
│     (240px)      │          (fluid)                     │
│                  │                                      │
│  Always visible  │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Tablet (768-1024px)
```
┌────────┬────────────────────────────────────────────────┐
│        │                                                │
│SIDEBAR │              MAIN CONTENT                      │
│(200px) │              (fluid)                           │
│compact │                                                │
│        │                                                │
└────────┴────────────────────────────────────────────────┘
```
- Sidebar width reduced to 200px
- Text labels shortened or hidden (icon-only mode optional)

### Mobile (<768px)
```
┌─────────────────────────────────────────────────────────┐
│  [☰]  StreamHub Logo                    [User ▾]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    MAIN CONTENT                         │
│                    (full width)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

  ☰ pressed → Drawer overlay:
  ┌──────────────────┐
  │  ▾ Dashboard     │
  │    ├ View All    │
  │    └ Search      │
  │                  │
  │  ▾ Admin (admin) │
  │    ├ Overview    │
  │    ├ ...         │
  │                  │
  │  [Close ✕]       │
  └──────────────────┘
```
- Sidebar hidden by default
- Hamburger menu (☰) toggles drawer overlay
- Full menu accessible via drawer

---

## Related Documents

- [User Flows](../user-flows.md) — Flow diagrams for all roles
- [Roles & Permissions](../../GUIDES/roles-and-permissions.md) — Permission matrix
- [Moderator Dual-View](../../GUIDES/roles-and-permissions.md#-moderator-dual-view-model) — Moderator view switching
- [Component Architecture](../COMPONENT_ARCHITECTURE.md) — Component hierarchy
- [Tag Management Page](./tag-management-page.md) — Admin tag CRUD wireframe

---

**Created:** 2026-03-14
**Designer:** Development Team
**Version:** 1.0
