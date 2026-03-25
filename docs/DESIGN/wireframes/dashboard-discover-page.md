# Dashboard Discover Page

> **Purpose:** Main page for browsing and discovering available dashboards by folder structure
> **Users:** All roles (USER, MODERATOR, ADMIN)
> **Current Implementation:** `app/pages/dashboard/discover.vue` using Strategy 4 (Pinia stores + composables)
> **Last Updated:** 2026-03-24
> **Version:** 5.0 (Multi-View Modes: Grid / Compact / List)

---

## 🎯 Key Principle

**Only accessible dashboards are shown**
- Approach 2: Show Only Accessible Folders
- Clean UX, no "locked" states
- User only sees folders with dashboards they can access

---

## 📐 Page Layout (Two-Pane Model)

```
┌─────────────────────────────────────────────────────┐
│              STREAMHUB DASHBOARD                    │
├──────────────────┬────────────────────────────────┤
│                  │                                │
│  LEFT PANE:      │  RIGHT PANE:                  │
│  FOLDER TREE     │  BREADCRUMB + DASHBOARD GRID  │
│  (Accordion)     │                                │
│                  │  🏠 > Sales > Regional        │
│  📂 Sales ↓      │                                │
│  ├─ 📂 Regional  │  4 Dashboards Found           │
│  │  └─ 📂 East   │                                │
│  ├─ 📂 Reports   │  ┌──────────┐  ┌──────────┐  │
│  └─ 📂 Analytics │  │Dashboard1│  │Dashboard2│  │
│                  │  └──────────┘  └──────────┘  │
│  📂 Finance ↓    │                                │
│  ├─ 📂 Budget    │  ┌──────────┐  ┌──────────┐  │
│  └─ 📂 Payroll   │  │Dashboard3│  │Dashboard4│  │
│                  │  └──────────┘  └──────────┘  │
└──────────────────┴────────────────────────────────┘
```

**Key Features:**
- ✅ Sidebar shows **FOLDERS ONLY** (not dashboards)
- ✅ Handles 4-5 level folder depth with smart collapse
- ✅ Dashboard grid in right pane with infinite scroll
- ✅ Breadcrumb for navigation and context

---

## 🏗️ Page Structure

### Layout & Components

**Layout:**
- Uses: `DiscoverPageLayout` (composition component, two-pane)
- Left: `FolderSidebar` with accordion behavior
- Right: `Breadcrumbs` + `DashboardGrid`

**State Management:**
- Pinia stores: `useDashboardStore`, `usePermissionsStore`
- Composable: `useDashboardPage()` (encapsulates all page logic)

**Key Components:**
- `FolderSidebar` - Folder tree with search
- `Breadcrumbs` - Current path navigation
- `DashboardGrid` - Dashboard cards with infinite scroll
- `QuickShareDialog` - Share dialog for moderators

---

## 📂 Sidebar: Folder Navigation (Accordion)

### Features

- **Accordion Behavior:** Folders expand/collapse to show/hide subfolders
- **Hierarchical Display:** Supports 4-5 levels deep
- **Search Box:** Find folders by name
- **Smart Collapse:** Only expands current path, collapses siblings

### Smart Collapse for Deep Hierarchies (4-5 Levels)

**Problem:** Deep folder hierarchies can cause sidebar overflow and poor UX

**Solution: Hybrid Model (Sidebar + Smart Collapse + Breadcrumb)**

1. **Sidebar:** Shows current path only (accordion collapse/expand)
   - Only expands folders in the current path
   - Auto-collapses sibling branches
   - Result: Max 3-4 visible levels at once

2. **Breadcrumb:** Shows full path
   - Example: `🏠 > Sales > Regional > East > Q1`
   - Click any level to jump there instantly

3. **Current Folder:** Fully expanded
   - Shows subfolders for drilling down

**Example Flow:**

```
User selects: Sales > Regional > East (3 levels)

Sidebar Display (Smart Collapsed):
📂 Sales ↓
├─ 📂 Regional ↓
│  └─ 📂 East ← SELECTED
└─ [Other folders collapsed]

Breadcrumb Display:
🏠 > Sales > Regional > East

Result:
✅ Sidebar never overflows
✅ User sees exact location
✅ Can navigate up via breadcrumb
✅ Can drill down via sidebar
```

**Implementation Functions:**
- `shouldExpandFolder(folder, currentPath)` - Check if folder should expand
- `getSidebarFolders(allFolders, currentPath)` - Return collapsed tree
- Both are in `FolderSidebar.vue` component

**Related:** See [COMPONENT_ARCHITECTURE.md](../COMPONENT_ARCHITECTURE.md) for detailed component structure

---

## 🗂️ Main Content Area (Right Pane)

### 1. Breadcrumb Navigation

```
🏠 > Sales > Regional > East

Features:
- Shows current path clearly
- Click any part to navigate back
- Supports 4-5 levels without truncation
- Updates dynamically when folder changes
```

### 2. Dashboard Header

```
☃️ พบ 50 แดชบอร์ด ใน 12 โฟลเดอร์           [▦][▤][≡]  📁โฟลเดอร์ 🏢บริษัท
                                              Grid Compact List

Features:
- Count of dashboards and folders
- View mode switcher: Grid / Compact / List (persisted in localStorage)
- Folder filter dropdown
- Company filter dropdown
- Expand/Collapse all folders buttons (in grouped view)
```

### 3. View Modes

**Grid (default):** 4 columns, full card (~320px height), open button visible

**Compact:** 5-6 columns, small card (~160px), 80px thumbnail, whole card clickable

**List:** Horizontal rows (~48px each), color swatch + name + tags + company + arrow

### 4. Dashboard Display

**Grouped View** (no folder selected): Dashboards grouped by folder with:
- Folder header: icon + name + count badge + moderator info
- Collapsible: click header to expand/collapse (chevron ▼/▶, 200ms animation)
- Card limit per folder: Grid=4, Compact=6, List=8 with "ดูทั้งหมด N แดชบอร์ด →" link
- Default: ≤5 folders expand all, >5 folders expand first 3

**Flat View** (folder selected): Dashboard cards/rows without folder grouping

### 5. Responsive Breakpoints

| Breakpoint | Grid | Compact | List |
|-----------|------|---------|------|
| Desktop (>1024px) | 4 col | 5-6 col | Full |
| Tablet (≤1024px) | 3 col | 4 col | Full |
| Mobile (≤768px) | 1 col | 2 col | Full |

---

## 🔐 Permission & Access Logic

**3-Layer Permission Check:**

1. **Layer 1: Direct Access**
   - Specific uid, role, or group assignment

2. **Layer 2: Company-Scoped**
   - Role or group access within user's company

3. **Layer 3: Restrictions**
   - Explicit deny or expiry dates

**Summary:**
- Folders shown: Only those with ≥1 accessible dashboard
- Dashboards shown: Only those with permission granted
- No "locked" icons - just don't show inaccessible items

**Full Details:** See [docs/GUIDES/roles-and-permissions.md](../../GUIDES/roles-and-permissions.md)

---

## 🎨 Role-Based Actions

| Role | View | Edit | Share | Delete | Manage<br/>Access |
|------|------|------|-------|--------|-------------------|
| USER | ✅ | ❌ | ❌ | ❌ | ❌ |
| MODERATOR (owner) | ✅ | ✅ | ✅ Quick | ✅ | ❌ |
| MODERATOR (other) | ✅ | ❌ | ❌ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ Full | ✅ | ✅ |

**Action Details:**
- **[Open]:** View dashboard on Dashboard View page
- **[Edit]:** Edit dashboard metadata and settings
- **[Share]:** Opens Quick Share dialog (direct access only)
- **[Manage Access]:** Admin-only, full 3-layer permission UI
- **[Delete]:** Delete dashboard (with confirmation)
- **[Request Edit]:** For MODERATOR viewing other's dashboard

**Workflows:** See [dashboard-view-page.md](./dashboard-view-page.md) for detailed action flows

---

## 🔄 User Flow

```
1. User navigates to /dashboard/discover
   ↓
2. Load folders + filter for accessible dashboards
   ↓
3. Show sidebar with accessible folders
   Show Dashboard Home (all accessible dashboards)
   ↓
4. User clicks folder in sidebar
   ├─ Sidebar updates (smart collapse)
   ├─ Breadcrumb updates
   └─ Dashboard grid shows dashboards in folder
   ↓
5. User clicks "Open" on dashboard
   └─ Navigate to /dashboard/{id}

6. User clicks breadcrumb level
   ├─ Jump to that folder
   └─ Refresh dashboard grid
```

---

## 📱 Responsive Design

- **Desktop (>1024px):** Full sidebar + 2-3 column grid
- **Tablet (768-1024px):** Collapsible sidebar + 2 column grid
- **Mobile (<768px):** Hamburger menu + 1 column list

**Detailed Patterns:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Implementation** | Actual Vue component | `app/pages/dashboard/discover.vue` |
| **Components** | Component architecture & hierarchy | [COMPONENT_ARCHITECTURE.md](../COMPONENT_ARCHITECTURE.md) |
| **Permissions** | 3-layer permission logic | [docs/GUIDES/roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **View Page** | What happens after clicking "Open" | [dashboard-view-page.md](./dashboard-view-page.md) |
| **Quick Share** | Share dialog details | [moderator-quick-share-dialog.md](./moderator-quick-share-dialog.md) |
| **Design System** | Colors, typography, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |
| **Mock Data** | Test data structure | [MOCK_DATA_STRUCTURE.md](../MOCK_DATA_STRUCTURE.md) |
| **User Flows** | Complete user journey diagrams | [user-flows.md](../user-flows.md) |

---

## ✨ Key Differences from v3.x

- ✅ Consolidated from 1,611 lines to ~500 lines
- ✅ Removed duplicate permission logic (use roles-and-permissions.md instead)
- ✅ Removed verbose component checklists (already implemented)
- ✅ Updated component names to match actual code
- ✅ Clarified Breadcrumbs (not "Tab")
- ✅ Added Strategy 4 (Pinia stores + composables)
- ✅ Emphasized accordion behavior for sidebar
- ✅ Added cross-references (Single Source of Truth)
- ✅ Included infinite scroll feature

---

**Created:** 2024-01-27
**Updated:** 2026-02-13 (v4.0 - Consolidated & Refactored)
**Designer:** Development Team
**Version:** 4.0
