# Admin Company Management Page

> **Purpose:** Manage subsidiary companies (create, edit, delete, activate/deactivate)
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/companies/index.vue` (to be created)
> **Last Updated:** 2026-03-15
> **Version:** 2.0

---

## 🎯 Key Principle

**Company Management = Multi-Company Support**
- Manage 10+ subsidiary companies (STTH, STTN, STCS, STNR, STPT, STPK, etc.)
- Activate/deactivate companies
- View company statistics
- Assign company codes and metadata

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with admin navigation sidebar
- Header: Breadcrumb + page title
- Content: Company list table + Company details panel

**Key Components:**
- `CompanyTable` - List of all companies
- `CompanyCard` - Company details and stats
- `CompanyModal` - Create/edit company modal

---

## 🎨 Page Layout

```
┌──────────────────────────────────────────────────────┐
│  🏢 Company Management              [➕ Add Company]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Filter: [Status▼] [Region▼]  Search...            │
│                                                      │
│  12 companies found                                  │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ ชื่อบริษัท          รหัส  กลุ่มภูมิภาค           สถานะ    ││
│  ├─────────────────────────────────────────────────┤│
│  │ สทรีมวอช (ปท.ไทย)  STTH  —                     🟢 Active ││
│  │ [Edit][Delete]                                  ││
│  │                                                 ││
│  │ สทรีมวอช (เชียงใหม่) STCM กลุ่มภาคเหนือ (Hub) 🟢 Active ││
│  │ [Edit][Delete]                                  ││
│  │                                                 ││
│  │ สทรีมวอช (พิษณุโลก) STPL กลุ่มภาคเหนือ (Sub)  🟢 Active ││
│  │ [Edit][Delete]                                  ││
│  │                                                 ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  [← Previous]  Page 1 of 2  [Next →]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🏢 Company Table

### Columns

| Column | Content | Actions |
|--------|---------|---------|
| **รหัส** | Company code (STTH, STCM, etc.) | Unique identifier, Sortable |
| **ชื่อบริษัท** | Company full name + description subtitle | Sortable |
| **กลุ่มภูมิภาค** | Region name + role badge (Hub/Sub), แสดง `—` ถ้าไม่มี region | Sortable |
| **สถานะ** | Active/Inactive toggle switch | Toggle inline |
| **Actions** | Edit, Delete | [✏️] [🗑️] |

### Row Actions

- **[Edit]** → Open Create/Edit Company modal
- **[Delete]** → Show confirmation, remove company
- **[Details]** → View company statistics (users, dashboards, folders)

### Filter & Search

- **Search:** ค้นหาตามรหัสหรือชื่อบริษัท
- **สถานะ:** ทั้งหมด, เปิดใช้งาน, ปิดใช้งาน
- **กลุ่มภูมิภาค:** ทั้งหมด, ไม่มีภูมิภาค, กลุ่มภาคเหนือ, กลุ่มภาคตะวันออกเฉียงเหนือ, ฯลฯ (ดึงจาก regions data)

---

## 🪟 Create/Edit Company Modal

```
┌────────────────────────────────────┐
│  Add Company                   [X] │
├────────────────────────────────────┤
│                                    │
│  ชื่อบริษัท (Name): *              │
│  [บริษัท สทรีมวอช (ประเทศไทย) จำกัด] │
│                                    │
│  รหัสบริษัท (Code): *              │
│  [STTH]                            │
│  (2-10 ตัวอักษร, ไม่สามารถแก้ได้) │
│                                    │
│  คำอธิบาย (Description):           │
│  [สำนักงานใหญ่ประเทศไทย...]        │
│                                    │
│  ┌─ ข้อมูลภูมิภาค ───────────────┐ │
│  │ กลุ่มภูมิภาค:                  │ │
│  │ [-- ไม่ระบุ (สำนักงานใหญ่) ▼] │ │
│  │                                │ │
│  │ บทบาท (Region Role):           │ │
│  │ [Hub / Sub ▼]  ← แสดงเมื่อเลือก region │
│  └────────────────────────────────┘ │
│                                    │
│  [Save Company] [Cancel]           │
│                                    │
└────────────────────────────────────┘
```

**Fields:**
- **ชื่อบริษัท (Name):** ชื่อเต็มของบริษัท (required)
- **รหัสบริษัท (Code):** 2–10 ตัวอักษร, unique, ไม่สามารถเปลี่ยนแปลงได้หลังสร้าง (required)
- **คำอธิบาย (Description):** Optional
- **กลุ่มภูมิภาค (Region):** dropdown จากข้อมูล regions, เลือก "ไม่ระบุ" สำหรับสำนักงานใหญ่ (optional)
- **บทบาท (Region Role):** `Hub` หรือ `Sub` — แสดงเฉพาะเมื่อเลือก Region (conditional)

**Validation:**
- Company Code ต้องไม่ซ้ำกัน
- Company Code ต้อง 2–10 ตัวอักษร
- Company Name is required
- Region Role required ถ้าเลือก Region

---

## 📊 Company Details Panel

```
┌────────────────────────────────────┐
│  COMPANY: Streamwash Thailand      │
│                                    │
│  Code: STTH                        │
│  Region: กลุ่มภาคเหนือ (Hub)       │
│  Status: 🟢 Active                 │
│  Created: Jan 15, 2026             │
│  Updated: Feb 10, 2026             │
│                                    │
│  STATISTICS:                       │
│  ────────────────────────         │
│  Users: 45 active                  │
│  Moderators: 5                     │
│  Folders: 12                       │
│  Dashboards: 18                    │
│                                    │
│  RECENT ACTIVITY:                  │
│  ────────────────────────         │
│  2 days ago: 2 users invited       │
│  5 days ago: Company activated     │
│                                    │
│  [Edit Company]                    │
│  [Deactivate Company] [Delete]     │
│                                    │
└────────────────────────────────────┘
```

**Displays:**
- Company metadata (code, region + role, status)
- Creation and update dates
- User/folder/dashboard counts
- Recent activity log
- Action buttons

---

## 🔄 Company Lifecycle

### Status States

| Status | Meaning | Actions |
|--------|---------|---------|
| **🟢 Active** | Company operational | Users can login, access dashboards |
| **🟡 Pending** | Awaiting setup | Admin/users can't login yet |
| **🔴 Inactive** | Disabled | Users can't login, no access |

### Transitions

- **Create → Pending** → Can edit company details
- **Pending → Active** → Company goes live, users can access
- **Active → Inactive** → Disable company (reversible)
- **Inactive → Deleted** → Permanent removal (only if no users)

---

## 📈 Company Statistics

For each company, track:
- Number of active users
- Number of moderators
- Number of dashboards
- Number of folders
- Creation date
- Last activity date
- Storage usage (optional)

---

## 🔄 Bulk Actions

- Activate multiple companies at once
- Deactivate multiple companies
- Export company list as CSV

---

## 📱 Responsive Design

- **Desktop (>1024px):** Full table with all columns visible
- **Tablet (768-1024px):** Collapsible columns, actions in dropdown
- **Mobile (<768px):** Card view instead of table

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Admin Dashboard** | Admin overview | [admin-dashboard-home-page.md](./admin-dashboard-home-page.md) |
| **User Management** | User CRUD page | [admin-user-management-page.md](./admin-user-management-page.md) |
| **Explorer** | Folder + Dashboard management | [admin-explorer-page.md](./admin-explorer-page.md) |
| **Company Guide** | Company architecture and setup | [company-management.md](../../GUIDES/company-management.md) |
| **Database Schema** | Company data structure | [database-schema.md](../../GUIDES/database-schema.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
