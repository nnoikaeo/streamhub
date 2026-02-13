# Admin Dashboard Home Page

> **Purpose:** Central hub for admin overview, quick access to management tools, and system status
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/index.vue` (to be created)
> **Last Updated:** 2026-02-14
> **Version:** 1.0

---

## 🎯 Key Principle

**Admin Hub = Quick Overview + Easy Access**
- Dashboard stats and system health
- Quick navigation to management areas
- Recent activity summary
- At-a-glance user and dashboard counts

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with admin navigation sidebar
- Header: `AdminHeader` (breadcrumb, admin label)
- Content: Grid of cards and panels

**Key Sections:**
- Dashboard Stats (top)
- Quick Actions (cards)
- Recent Activity Log
- System Status

---

## 📊 Dashboard Stats Section

```
┌─────────────────────────────────────────────┐
│  ADMIN DASHBOARD                            │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Users      👥 Companies    📁 Folders   │
│  ━━━━━━━        ━━━━━━━━        ━━━━━━     │
│  145 active    12 active       87 total    │
│  +3 this week  2 pending       5 archived  │
│                                             │
│  📈 Dashboards     🔐 Permissions         │
│  ━━━━━━━━━━        ━━━━━━━━━              │
│  24 published      3 admin users          │
│  +2 this month     8 moderators           │
│                                             │
└─────────────────────────────────────────────┘
```

**Shows:**
- Total users/companies/folders/dashboards
- Active, pending, archived counts
- Trends (new this week/month)
- Quick drill-down links

---

## 🎯 Quick Actions Section

```
┌─────────────────────────────────────────────┐
│  QUICK ACTIONS                              │
├─────────────────────────────────────────────┤
│                                             │
│  [➕ Add User]  [➕ Add Dashboard]         │
│  [➕ Add Company]  [➕ Add Folder]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Buttons:**
- Add User → Navigate to `/admin/users/new`
- Add Dashboard → Navigate to `/admin/dashboards/new`
- Add Company → Navigate to `/admin/companies/new`
- Add Folder → Navigate to `/admin/folders/new`

---

## 📋 Recent Activity Log

```
┌─────────────────────────────────────────────┐
│  RECENT ACTIVITY (Last 24 hours)            │
├─────────────────────────────────────────────┤
│                                             │
│  2 hours ago    User "John" invited 3      │
│                 users to company STTH      │
│                                             │
│  5 hours ago    Dashboard "Q4 Report"      │
│                 created by "Sarah"         │
│                                             │
│  1 day ago      Company "STPK" activated   │
│                 by "Admin"                 │
│                                             │
│  [View Full Audit Log]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Shows:**
- Last 5-10 important actions
- Timestamp
- Actor and action description
- Link to full audit log

---

## 🔐 System Status Panel

```
┌─────────────────────────────────────────────┐
│  SYSTEM STATUS                              │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 Firestore:   Connected                 │
│  🟢 Authentication: Active                 │
│  🟢 Email Notifs: Configured               │
│  🟡 Looker API:   Needs Check              │
│                                             │
│  Last Check: 2 minutes ago                 │
│  [Run Diagnostics]                         │
│                                             │
└─────────────────────────────────────────────┘
```

**Status Indicators:**
- 🟢 Green: Operational
- 🟡 Yellow: Warning/Config needed
- 🔴 Red: Error/Down

---

## 📱 Responsive Design

- **Desktop (>1024px):** 2-3 column grid with full stats
- **Tablet (768-1024px):** Stacked panels with compact stats
- **Mobile (<768px):** Single column, simplified stats

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Admin Permissions** | Permission management UI | [admin-permission-management-page.md](./admin-permission-management-page.md) |
| **User Management** | User CRUD page | [admin-user-management-page.md](./admin-user-management-page.md) |
| **Folder Management** | Folder CRUD page | [admin-folder-management-page.md](./admin-folder-management-page.md) |
| **Company Management** | Company CRUD page | [admin-company-management-page.md](./admin-company-management-page.md) |
| **Design System** | Colors, typography, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
