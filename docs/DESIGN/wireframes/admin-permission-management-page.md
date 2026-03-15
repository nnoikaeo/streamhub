# Permission Management Page

> **Purpose:** Permission management for dashboards using 3-column pattern
> **Users:** Admin + Moderator
> **Implementation:** `app/pages/admin/permissions.vue`, `app/pages/manage/permissions.vue`
> **Last Updated:** 2026-03-15
> **Version:** 5.0 (3-Column Pattern + Moderator Support)

---

## Key Principle

**PermissionEditor = Shared component for Admin and Moderator permission management**
- 3-Column pattern per tab (consistent with GroupForm member selector)
- Admin: 3 tabs (Direct, Company, Restrictions)
- Moderator: 2 tabs (Direct, Company — no Restrictions)
- Parent page owns Save/Reset — PermissionEditor emits changes only

---

## Page Structure

### Layout
- Uses: PageLayout with sidebar navigation
- Left: Navigation sidebar (admin or moderator)
- Right: Dashboard selector + PermissionEditor

### Components
- `PermissionEditor` — Main component (3 tabs, 3-column per tab)
- `PageLayout` — Shared layout wrapper

---

## Admin Sidebar Navigation

```
ADMIN PANEL MENU

🏠 Home

━━ MANAGEMENT ━━
📊 Dashboards
📋 Folders
👥 Users
🔐 Permissions    ← /admin/permissions

━━ REPORTS ━━
📊 Audit Log
```

---

## Permission Editor (3-Column Pattern)

### Header Section

```
Dashboard: Sales East Performance
Owner: John (Moderator)
Created: 2024-01-15 | Modified: 2024-02-01
Current Access: 4 users + 3 groups
```

---

### Tab 1: สิทธิ์ตรง (Direct Access)

**3-Column Layout:**

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  ประเภท      │  รายการ              │  สิทธิ์ที่ให้แล้ว     │
├──────────────┼──────────────────────┼──────────────────────┤
│              │  🔍 ค้นหา...         │  สิทธิ์ที่ให้แล้ว     │
│  ► ผู้ใช้ (5)│                      │  ล้างทั้งหมด          │
│    กลุ่ม (3) │  สมชาย (STTH)    [+] │ ──────────────────── │
│              │  นายหา (STTH)    [+] │  👤 สมชาย  STTH  [✕] │
│              │  user1 (STTN)    [+] │  👤 user1  STTN  [✕] │
│              │                      │  👥 Finance  3คน [✕] │
└──────────────┴──────────────────────┴──────────────────────┘
```

**Column 1:** Toggle between ผู้ใช้ (users) and กลุ่ม (groups) with counts
**Column 2:** Searchable list — users or groups depending on Column 1 selection. Click "+" to add.
**Column 3:** All granted direct permissions (users with 👤, groups with 👥). Click ✕ to remove.

**Logic:** `(user_uid OR user_group) = Access Granted`

---

### Tab 2: ตามบริษัท (Company-Scoped)

**3-Column Layout:**

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  บริษัท      │  กลุ่ม · STTH        │  สรุปสิทธิ์ทุกบริษัท  │
├──────────────┼──────────────────────┼──────────────────────┤
│              │  🔍 ค้นหา...         │                      │
│  ► STTH (2)  │                      │  ── STTH ──          │
│    STTN (1)  │  ☑ Finance    3คน   │  👥 Finance      [✕] │
│    STCS (0)  │  ☑ Sales      5คน   │  👥 Sales        [✕] │
│              │  ☐ Operations  4คน   │                      │
│              │  ☐ Marketing   2คน   │  ── STTN ──          │
│              │                      │  👥 Finance      [✕] │
└──────────────┴──────────────────────┴──────────────────────┘
```

**Column 1:** Active companies with badge showing number of selected groups
**Column 2:** Checkbox list of groups for selected company. Toggle to add/remove.
**Column 3:** Summary of all company permissions, grouped by company header. Click ✕ to remove.

**Important:** Groups only — no Roles in company-scoped UI. Roles field preserved in data model.

**Logic:** `(company + group) = Access Granted`

**Full Details:** See [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md)

---

### Tab 3: ข้อจำกัด (Restrictions) — Admin Only

**3-Column Layout:**

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  ประเภท      │  ผู้ใช้              │  ข้อจำกัดทั้งหมด      │
├──────────────┼──────────────────────┼──────────────────────┤
│              │  🔍 ค้นหา...         │  ข้อจำกัดทั้งหมด      │
│  ► ระงับ (2) │                      │  ล้างทั้งหมด          │
│    หมดอายุ(1)│  สมชาย (STTH)    [+] │ ──────────────────── │
│              │  นายหา (STTH)    [+] │  ❌ user5  ระงับ [✕] │
│              │  user3 (STTN)    [+] │  ❌ user7  ระงับ [✕] │
│              │                      │  ⏰ user6  28/02 [✕] │
└──────────────┴──────────────────────┴──────────────────────┘
```

**Column 1:** Toggle between ระงับ (revoke) and หมดอายุ (expiry) with counts
**Column 2:** User list. Click "+" opens mini popup to enter reason (revoke) or date (expiry).
**Column 3:** All restrictions (❌ revoked, ⏰ expiry). Click ✕ to remove.

**Visibility:** `v-if="showRestrictions"` — Admin only (Moderator does not see this tab)

**Logic:** `(revoked OR expired) = Access Denied`

---

## Role-Based Visibility

| Feature | Admin (`/admin/permissions`) | Moderator (`/manage/permissions`) |
|---------|------|-----------|
| Tab 1: สิทธิ์ตรง (Direct) | Yes | Yes |
| Tab 2: ตามบริษัท (Company) | Yes — all companies | Yes — all companies |
| Tab 3: ข้อจำกัด (Restrictions) | Yes | No (`showRestrictions: false`) |
| Dashboard scope | All dashboards | Assigned folders only |
| Save/Reset | Page-level buttons | Page-level buttons |

---

## Moderator Permission Management

**Route:** `/manage/permissions`

**Same PermissionEditor component with:**
- `showRestrictions: false` — Tab 3 hidden
- Dashboard selector scoped to assigned folders only (via `useModeratorDashboards()`)
- Breadcrumb: จัดการ > สิทธิ์

---

## Action Buttons (Page-Level)

```
[💾 Save Changes]      - Save all permission modifications (page-level, not in PermissionEditor)
[↻ Reset]              - Discard changes
```

---

## Common Tasks

### Grant Direct Access to User
1. Select Tab 1 (สิทธิ์ตรง)
2. Click "ผู้ใช้" in Column 1
3. Search and click "+" on user in Column 2
4. User appears in Column 3
5. Click [Save Changes] at page level

### Add Group Access for Company
1. Select Tab 2 (ตามบริษัท)
2. Click company in Column 1
3. Check group checkboxes in Column 2
4. Summary updates in Column 3
5. Click [Save Changes] at page level

### Revoke User Access (Admin Only)
1. Select Tab 3 (ข้อจำกัด)
2. Click "ระงับ" in Column 1
3. Click "+" on user in Column 2
4. Enter reason in popup, click "ระงับ"
5. Click [Save Changes] at page level

### Set Access Expiry (Admin Only)
1. Select Tab 3 (ข้อจำกัด)
2. Click "หมดอายุ" in Column 1
3. Click "+" on user in Column 2
4. Select date in popup, click "ตั้งวันหมดอายุ"
5. Click [Save Changes] at page level

---

## Responsive Design

- **Desktop (>1024px):** Full sidebar + 3-column panels
- **Tablet (768-1024px):** Collapsible sidebar + 3-column panels
- **Mobile (<640px):** Panels stack vertically (1 column)

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Permissions Guide** | Complete 3-layer permission logic | [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **Discover Page** | User dashboard discovery view | [dashboard-discover-page.md](./dashboard-discover-page.md) |
| **Quick Share** | Moderator quick share dialog | [moderator-quick-share-dialog.md](./moderator-quick-share-dialog.md) |
| **Design System** | Colors, typography, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |
| **Database Schema** | Permission data structure | [database-schema.md](../../GUIDES/database-schema.md) |

---

**Created:** 2024-02-03
**Updated:** 2026-03-15 (v5.0 — 3-Column Pattern + Moderator Support)
**Designer:** Development Team
**Version:** 5.0
