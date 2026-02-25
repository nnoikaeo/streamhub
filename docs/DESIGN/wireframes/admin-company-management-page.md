# Admin Company Management Page

> **Purpose:** Manage subsidiary companies (create, edit, delete, activate/deactivate)
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/companies/index.vue` (to be created)
> **Last Updated:** 2026-02-14
> **Version:** 1.0

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
│  │ Company Name    Code  Country   Users   Status   ││
│  ├─────────────────────────────────────────────────┤│
│  │ Streamwash TH   STTH  Thailand  45      🟢 Active││
│  │ Streamwash Laos STTN  Laos      28      🟢 Active││
│  │ Streamwash CS   STCS  Cambodia  12      🟢 Active││
│  │ [Edit][Delete][View Details]                    ││
│  │                                                 ││
│  │ Streamwash NR   STNR  Myanmar   8       🟡 Pending││
│  │ [Edit][Delete][View Details]                    ││
│  │                                                 ││
│  │ Streamwash PKO  STPK  Vietnam   0       🔴 Inactive││
│  │ [Edit][Delete][View Details]                    ││
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
| **Name** | Company full name | Sortable |
| **Code** | Company code (STTH, STTN, etc.) | Unique identifier |
| **Country** | Country/Region | Sortable |
| **Users** | Number of active users | Click to filter users by company |
| **Status** | Active, Pending, Inactive | Sortable |
| **Created** | Date created | Sortable |
| **Actions** | Edit, Delete, Details | [Edit] [Delete] [Details] |

### Row Actions

- **[Edit]** → Open Create/Edit Company modal
- **[Delete]** → Show confirmation, remove company
- **[Details]** → View company statistics (users, dashboards, folders)

### Filter & Search

- **Status:** All, Active, Pending, Inactive
- **Region:** All, Thailand, Laos, Cambodia, Myanmar, Vietnam, etc.
- **Search:** Search by company name or code

---

## 🪟 Create/Edit Company Modal

```
┌────────────────────────────────────┐
│  Add Company                   [X] │
├────────────────────────────────────┤
│                                    │
│  Company Name:                     │
│  [Streamwash Thailand]             │
│                                    │
│  Company Code:                     │
│  [STTH]                            │
│  (2-4 uppercase letters)           │
│                                    │
│  Country/Region:                   │
│  [Thailand ▼]                      │
│                                    │
│  Description:                      │
│  [HQ in Bangkok]                   │
│                                    │
│  Contact Email:                    │
│  [admin@streamwash-th.com]         │
│                                    │
│  Status:                           │
│  🟢 Active   ○ Pending   ○ Inactive│
│                                    │
│  [Save Company] [Cancel]           │
│                                    │
└────────────────────────────────────┘
```

**Fields:**
- **Company Name:** Full legal name (required)
- **Company Code:** Unique 2-4 letter code (required)
- **Country/Region:** Dropdown of countries
- **Description:** Optional notes
- **Contact Email:** Company admin email (optional)
- **Status:** Active, Pending, or Inactive toggle

**Validation:**
- Company Code must be unique
- Company Code must be 2-4 characters, uppercase
- Company Name is required

---

## 📊 Company Details Panel

```
┌────────────────────────────────────┐
│  COMPANY: Streamwash Thailand      │
│                                    │
│  Code: STTH                        │
│  Country: Thailand                 │
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
- Company metadata (code, country, status)
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
| **Folder Management** | Folder CRUD page | [admin-folder-management-page.md](./admin-folder-management-page.md) |
| **Company Guide** | Company architecture and setup | [company-management.md](../../GUIDES/company-management.md) |
| **Database Schema** | Company data structure | [database-schema.md](../../GUIDES/database-schema.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
