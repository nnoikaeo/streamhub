# Admin Folder Management Page

> ⚠️ **DEPRECATED — Version 1.0**
> เอกสารนี้ถูกแทนที่โดย [admin-explorer-page.md](./admin-explorer-page.md) (v2.0)
> การออกแบบเปลี่ยนจาก Two-pane Folder+Detail มาเป็น **Full File Explorer Style**
> ดูรายละเอียดการตัดสินใจได้ที่ [admin-explorer-page.md](./admin-explorer-page.md)

> **Purpose:** Manage folder hierarchy across companies (create, edit, delete, assign moderators)
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/folders/index.vue` (to be created)
> **Last Updated:** 2026-02-14 (Deprecated: 2026-03-12)
> **Version:** 1.0 (Deprecated)

---

## 🎯 Key Principle

**Folder Management = Hierarchical Structure + Moderator Assignment**
- Create nested folder hierarchies
- Assign moderators to manage folders
- Company-scoped (each company has its own folder tree)
- View dashboards in each folder

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with admin navigation sidebar
- Header: Breadcrumb + page title
- Content: Company selector + Folder tree + Details panel

**Key Components:**
- `FolderTree` - Hierarchical folder display
- `FolderCard` - Folder details and actions
- `FolderModal` - Create/edit folder modal
- `CompanySelector` - Select which company's folders to view

---

## 🎨 Page Layout

```
┌──────────────────────────────────────────────────────┐
│  📁 Folder Management                  [➕ New Folder]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  Company: [STTH ▼]                                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Folder Tree                    Details Panel  │ │
│  │                                                 │ │
│  │  📂 Sales                       Selected:      │ │
│  │  ├─ 📂 Regional                 Sales > East   │ │
│  │  │  └─ 📂 East ← SELECTED       ────────────  │ │
│  │  │     └─ 📂 Q1                                │ │
│  │  ├─ 📂 Reports                  Moderator:    │ │
│  │  └─ 📂 Analytics                John Admin     │ │
│  │                                                 │ │
│  │  📂 Finance                      Dashboards:   │ │
│  │  ├─ 📂 Budget                    • Sales East  │ │
│  │  └─ 📂 Payroll                   • Regional    │ │
│  │                                                 │ │
│  │  📂 Operations                    [Edit Folder]│ │
│  │                                    [Delete]    │ │
│  │                                                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🌳 Folder Tree Panel (Left)

### Features

- **Hierarchical Display:** Supports unlimited nesting (usually 3-5 levels)
- **Company-Scoped:** View folders for selected company only
- **Expand/Collapse:** Click folder to expand subfolders
- **Folder Icons:**
  - 📂 Regular folder
  - 🔒 Restricted folder (has access rules)

### Interactions

- **Click Folder:** Select and show details on right panel
- **Right-Click:** Context menu (Edit, Delete, New Subfolder)
- **Drag & Drop:** Reorder folders (optional feature)

---

## 📋 Folder Details Panel (Right)

```
┌────────────────────────────────┐
│  FOLDER: Sales > East          │
│                                │
│  📁 Folder Name:               │
│  East                          │
│                                │
│  Description:                  │
│  [Eastern region sales data]   │
│                                │
│  Company: STTH                 │
│  Created: Feb 13, 2026         │
│                                │
│  Assigned Moderator:           │
│  [John Admin ▼]                │
│  Can assign folders to one     │
│  moderator for management      │
│                                │
│  Dashboards in this folder: 3  │
│  • Sales East Performance      │
│  • Regional Sales Map          │
│  • East Quarterly Report       │
│                                │
│  [Edit Folder] [Delete]        │
│                                │
└────────────────────────────────┘
```

**Displays:**
- Folder name (clickable to edit)
- Description
- Parent company
- Created date
- Assigned moderator
- Count and list of dashboards

---

## 🪟 Create/Edit Folder Modal

```
┌────────────────────────────────────┐
│  Create Folder                 [X] │
├────────────────────────────────────┤
│                                    │
│  Folder Name:                      │
│  [East]                            │
│                                    │
│  Description:                      │
│  [Eastern region sales data]       │
│                                    │
│  Parent Folder:                    │
│  [Sales > Regional ▼]              │
│  (Choose "Root" for top-level)     │
│                                    │
│  Company:                          │
│  [STTH ▼]                          │
│  (Auto-filled, read-only)          │
│                                    │
│  Assigned Moderator:               │
│  [John Admin ▼]                    │
│  (Optional, for moderate folder)   │
│                                    │
│  [Create Folder] [Cancel]          │
│                                    │
└────────────────────────────────────┘
```

**Fields:**
- **Folder Name:** Display name (required)
- **Description:** Optional folder description
- **Parent Folder:** Choose parent (for creating subfolders)
- **Company:** Company assignment (required)
- **Moderator:** Assign folder to moderator (optional)

---

## 🔄 Folder Actions

### Available Actions

- **Create Folder** → New folder at any level (via [New Folder] button)
- **Edit Folder** → Change name, description, moderator assignment
- **Delete Folder** → Remove folder (with cascade warning)
- **View Dashboards** → See dashboards in folder
- **Assign Moderator** → Designate folder owner

### Bulk Actions

- Assign moderator to multiple folders
- Change parent folder for multiple items
- Delete multiple empty folders

---

## 🌍 Company-Scoped Behavior

**Key Principle:** Each company has isolated folder structure

- Switch company → View that company's folder tree only
- Create folder → Automatically assigned to selected company
- Admin can manage all companies' folders
- Moderators see only their assigned folders in Discover page

---

## 📝 Folder Statistics

For each folder, track:
- Number of dashboards
- Number of assigned moderators
- Last modified date
- Subfolder count

---

## 📱 Responsive Design

- **Desktop (>1024px):** Two-pane layout with full tree
- **Tablet (768-1024px):** Collapsible tree, stacked panels
- **Mobile (<768px):** Single pane, tree converted to dropdown

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Admin Dashboard** | Admin overview | [admin-dashboard-home-page.md](./admin-dashboard-home-page.md) |
| **User Management** | User CRUD page | [admin-user-management-page.md](./admin-user-management-page.md) |
| **Company Management** | Company CRUD page | [admin-company-management-page.md](./admin-company-management-page.md) |
| **Discover Page** | User dashboard discovery | [dashboard-discover-page.md](./dashboard-discover-page.md) |
| **Database Schema** | Folder data structure | [database-schema.md](../../GUIDES/database-schema.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
