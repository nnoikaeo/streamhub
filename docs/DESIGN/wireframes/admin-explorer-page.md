# Admin Explorer Page

> **Purpose:** Unified File Explorer for managing folder hierarchy and dashboards in one place
> **Users:** Admin (full access), Moderator (assigned folders only)
> **Current Implementation:** `app/pages/admin/explorer/[[folderId]].vue` (to be created)
> **Note:** Unified File Explorer replacing the previous folder management page
> **Last Updated:** 2026-03-12
> **Version:** 2.0

---

## 🎯 Key Principle

**Full File Explorer Style = One place for everything**
- Admin และ Moderator คุ้นเคยกับ mental model นี้อยู่แล้ว (macOS Finder / Windows Explorer / Google Drive)
- ไม่ต้องสลับหน้าระหว่าง "จัดการ folder" กับ "จัดการ dashboard"
- Navigate ด้วย folder tree ซ้าย, ดูและจัดการ contents ขวา

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with admin navigation sidebar
- Header: Breadcrumb แสดง path ปัจจุบัน (clickable)
- Content: Two-pane — FolderTree (left) + Contents Panel (right)

**Key Components:**
- `FolderTree` — Hierarchical folder navigation (existing component)
- `ExplorerContentsPanel` — แสดง subfolders + dashboards ของ folder ที่เลือก
- `FolderForm` — Modal สำหรับ create/edit folder (existing)
- `DashboardForm` — Modal สำหรับ create/edit dashboard (existing)
- `ConfirmDialog` — Confirmation สำหรับ delete (existing)

---

## 🎨 Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🏠 Root  >  📂 Sales  >  📂 Regional  >  📂 East               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── FolderTree (left) ───┬─── Contents Panel (right) ───────┐ │
│  │                         │                                   │ │
│  │  📂 Sales               │  [➕ New Folder] [➕ New Dashboard]│ │
│  │  ├─ 📂 Regional         │  ─────────────────────────────── │ │
│  │  │  └─ 📂 East  ← HERE  │  ชื่อ              ประเภท  Actions│ │
│  │  ├─ 📂 Reports          │  📂 Budget Reports  Folder  ✏️ 🗑️ │ │
│  │  └─ 📂 Analytics        │  📂 Q1 Summary      Folder  ✏️ 🗑️ │ │
│  │                         │  ───────────────────────────── │ │ │
│  │  📂 Finance             │  📊 Sales East Perf  Dashboard ✏️ 🗑️│ │
│  │  📂 Operations          │  📊 Regional Map     Dashboard ✏️ 🗑️│ │
│  │                         │  📊 East Quarterly   Dashboard ✏️ 🗑️│ │
│  └─────────────────────────┴───────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🌳 FolderTree Panel (Left)

- Hierarchical display, supports unlimited nesting
- Expand/collapse ด้วย click ที่ arrow icon
- Click folder → navigate เข้า folder (เปลี่ยน URL + แสดง contents)
- Selected folder highlight ด้วย active state

**สิทธิ์:**
- Admin: เห็นทุก folder
- Moderator: เห็นเฉพาะ folder ที่ถูก assign (`assignedModerators` contains UID)

---

## 📋 Contents Panel (Right)

### Toolbar
```
[➕ New Folder]  [➕ New Dashboard]         [🔍 ค้นหา...]
```
- "New Folder" → pre-fill `parentId = currentFolderId`
- "New Dashboard" → pre-fill `folderId = currentFolderId`

### Contents List

แสดง 2 ประเภทในตารางเดียว โดย **folder แสดงก่อน** ตามด้วย dashboards:

```
ชื่อ                    ประเภท      สถานะ       Actions
────────────────────────────────────────────────────────────
📂 Budget Reports       Folder      Active      [✏️] [🗑️]
📂 Q1 Summary           Folder      Active      [✏️] [🗑️]
────────────────────────────────────────────────────────────
📊 Sales East Perf      Dashboard   Active      [✏️] [🗑️]
📊 Regional Sales Map   Dashboard   Archived    [✏️] [🗑️]
```

### Interactions

| Action | Folder | Dashboard |
|--------|--------|-----------|
| Single click | Select (highlight) | Select (highlight) |
| Double click | Navigate เข้า folder | เปิด dashboard view |
| ✏️ Edit | เปิด FolderForm modal | เปิด DashboardForm modal |
| 🗑️ Delete | ConfirmDialog → delete | ConfirmDialog → delete |

> **หมายเหตุ:** Right-click context menu — ยังไม่ implement ในรุ่นนี้
> ใช้ hover action buttons (✏️ 🗑️) แทน

### Empty State
```
📂 ยังไม่มีเนื้อหาใน folder นี้
[➕ New Folder]  [➕ New Dashboard]
```

---

## 🧭 Navigation & URL

```
/admin/explorer              → Root view (แสดง top-level folders)
/admin/explorer/folder_001   → เข้า folder "Sales"
/admin/explorer/folder_042   → เข้า "Sales > Regional > East"
```

**Breadcrumb:**
- แต่ละ segment คลิกได้ → navigate กลับขึ้นไปได้
- "🏠 Root" → `/admin/explorer`

**Browser back/forward:**
- ทำงานได้ตามปกติเพราะ URL เปลี่ยนตาม navigation

---

## 👥 Moderator View

- เห็นเฉพาะ folder ที่ `assignedModerators` มี UID ของตัวเอง
- folder ที่ไม่ได้ assigned จะไม่ปรากฏใน FolderTree และ Contents Panel
- ปุ่ม "New Folder" ซ่อนสำหรับ Moderator (Admin only)
- ปุ่ม "New Dashboard" — Moderator สามารถสร้างได้ใน folder ที่ assigned

---

## 🔗 ความสัมพันธ์กับ `/admin/dashboards`

> **การตัดสินใจ (2026-03-12):** คงไว้ `/admin/dashboards` เป็น **Global Dashboard List View**

สองหน้าทำงานร่วมกัน ไม่ได้แทนกัน:

| หน้า | วัตถุประสงค์ | เมื่อใช้ |
|------|-------------|----------|
| `/admin/explorer` | Browse และจัดการตาม folder hierarchy | รู้ว่า dashboard อยู่ folder ไหน หรือต้องการ navigate ตาม structure |
| `/admin/dashboards` | ดู/ค้นหา/แก้ไข dashboard **ทุกตัวจากทุก folder** ในที่เดียว | ต้องการหา dashboard โดยไม่รู้ว่าอยู่ folder ไหน หรือต้องการ bulk manage |

**เปรียบเทียบ:** Google Drive มีทั้ง "My Drive" (explorer) และ "Search results" (global list)

```
Admin Sidebar:
├── Explorer      → /admin/explorer       (browse by folder)
├── Dashboards    → /admin/dashboards     (all dashboards, global view)
├── Users         → /admin/users
└── Companies     → /admin/companies
```

---

## 📱 Responsive Design

- **Desktop (>1024px):** Two-pane layout แบบ side-by-side
- **Tablet (768-1024px):** FolderTree collapsible (toggle button), Contents full width
- **Mobile (<768px):** FolderTree เป็น dropdown selector ด้านบน, Contents full width

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Admin Dashboard Home** | Admin overview hub | [admin-dashboard-home-page.md](./admin-dashboard-home-page.md) |
| **Admin Dashboards** | Global dashboard list view | _(page ยังคงมีอยู่)_ |
| **User Management** | User CRUD page | [admin-user-management-page.md](./admin-user-management-page.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-03-12
**Version:** 2.0 (Full File Explorer Style)
**Decision:** เปลี่ยนจาก Two-pane Folder+Detail เป็น Full File Explorer เพราะ admin/moderator คุ้นเคยกับ mental model นี้อยู่แล้ว
