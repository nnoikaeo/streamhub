# Permission Management Page

> **Purpose:** Permission management for dashboards using unified 3-column pattern
> **Users:** Admin + Moderator
> **Implementation:** `app/pages/admin/permissions.vue`, `app/pages/manage/permissions.vue`
> **Last Updated:** 2026-03-18
> **Version:** 6.0 (Unified 3-Column — No Tabs)

---

## Key Principle

**PermissionEditor = Shared component for Admin and Moderator permission management**
- Single unified 3-column panel (no tabs)
- Column 1: Type selector (ผู้ใช้ / กลุ่ม / บริษัท) with counts
- Column 2: Searchable item list (shows ✓ for added items, + for available)
- Column 3: All granted permissions unified with type badges
- Restrictions: Separate section below (Admin only)
- Parent page owns Save/Reset — PermissionEditor emits changes only

---

## Page Structure

### Layout
- Uses: PageLayout with sidebar navigation
- Left: Navigation sidebar (admin or moderator)
- Right: Dashboard selector + PermissionEditor (unified 3-column + restrictions section)

### Components
- `PermissionEditor` — Main component (unified 3-column, no tabs)
- `PageLayout` — Shared layout wrapper

---

## Navigation

### Admin
- `/admin/explorer` — File explorer with moderator assignment (👥) and permission shortcut (🔑)
- `/admin/permissions` — Permission management (accessible via 🔑 buttons in explorer)

### Moderator
- `/manage/explorer` — File explorer scoped to assigned folders
- `/manage/permissions` — Permission management (accessible via 🔑 buttons in explorer)

**Note:** The "สิทธิ์" (Permissions) menu was removed from sidebar for both roles.
Permissions page is accessed via 🔑 buttons on dashboard rows and search results in explorer.

---

## Permission Editor (Unified 3-Column Pattern)

### Header Section

```
Dashboard: Sales East Performance
Owner: John (Moderator)
Created: 2024-01-15 | Modified: 2024-02-01
Current Access: 4 users + 3 groups
```

---

### Access Grant Section (Unified 3-Column)

**Single panel — no tabs. Column 1 switches context for Column 2.**

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  ประเภท      │  รายการ              │  สิทธิ์ที่ให้แล้ว     │
├──────────────┼──────────────────────┼──────────────────────┤
│              │  🔍 ค้นหา...         │  สิทธิ์ที่ให้แล้ว     │
│ ► 👤 ผู้ใช้ 2│                      │  ล้างทั้งหมด          │
│   👥 กลุ่ม  1│  สมชาย (STTH)    [✓] │ ──────────────────── │
│   🏢 บริษัท 1│  นายหา (STTH)    [+] │  👤 สมชาย            │
│              │  user1 (STTN)    [✓] │     สิทธิ์ตรง · STTH  │
│              │  user3 (STTN)    [+] │  👤 user1             │
│              │                      │     สิทธิ์ตรง · STTN  │
│              │                      │  👥 Finance           │
│              │                      │     สิทธิ์ตรง(กลุ่ม)  │
│              │                      │     · 3 คน            │
│              │                      │  🏢 STTH              │
│              │                      │     ตามบริษัท (12 คน) │
└──────────────┴──────────────────────┴──────────────────────┘
```

**Column 1 — ประเภท:** Toggle between ผู้ใช้, กลุ่ม, and บริษัท. Count shows how many are currently granted.
**Column 2 — รายการ:** Searchable list based on Column 1 selection. ✓ = already added (click to remove), + = available (click to add).
**Column 3 — สิทธิ์ที่ให้แล้ว:** Unified list of ALL granted permissions with type badges:
- 👤 User: "สิทธิ์ตรง · {company}"
- 👥 Group: "สิทธิ์ตรง(กลุ่ม) · N คน"
- 🏢 Company: "ตามบริษัท (N คน)"

Click ✕ to remove any item.

**Logic:** `(user_uid OR user_group OR user_company) = Access Granted`

---

### Restrictions Section (Admin only)

Separate section below the main editor. `v-if="showRestrictions"`

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

**Logic:** `(revoked OR expired) = Access Denied`

---

## Role-Based Visibility

| Feature | Admin (`/admin/permissions`) | Moderator (`/manage/permissions`) |
|---------|------|-----------|
| Access Grant (Unified 3-Column) | Yes — all users/groups/companies | Yes — all users/groups/companies |
| Restrictions Section | Yes | No (`showRestrictions: false`) |
| Dashboard scope | All dashboards | Assigned folders only |
| Save/Reset | Page-level buttons | Page-level buttons |

---

## Moderator Permission Management

**Route:** `/manage/permissions`

**Same PermissionEditor component with:**
- `showRestrictions: false` — Restrictions section hidden
- Dashboard selector scoped to assigned folders only (via `useModeratorDashboards()`)
- Breadcrumb: จัดการ > สิทธิ์
- Auto-select dashboard via `?dashboard=id` query param (from explorer 🔑 button)
- Pre-filter by folder via `?folder=id` query param (from explorer folder 🔑 button, admin only)
- Back-navigation after save/cancel when navigated from explorer

---

## Action Buttons (Page-Level)

```
[💾 Save Changes]      - Save all permission modifications (page-level, not in PermissionEditor)
[↻ Reset]              - Discard changes
```

---

## Common Tasks

### Grant Direct Access to User
1. Select "👤 ผู้ใช้" in Column 1
2. Search and click "+" on user in Column 2
3. User appears in Column 3 with "สิทธิ์ตรง" badge
4. Click [Save Changes] at page level

### Add Group Access
1. Select "👥 กลุ่ม" in Column 1
2. Click "+" on group in Column 2
3. Group appears in Column 3 with "สิทธิ์ตรง(กลุ่ม)" badge
4. Click [Save Changes] at page level

### Grant Company-Wide Access
1. Select "🏢 บริษัท" in Column 1
2. Click company in Column 2
3. Company appears in Column 3 with "ตามบริษัท (N คน)" badge
4. Click [Save Changes] at page level

### Revoke User Access (Admin Only)
1. In Restrictions section, click "ระงับ" in Column 1
2. Click "+" on user in Column 2
3. Enter reason in popup, click "ระงับ"
4. Click [Save Changes] at page level

### Set Access Expiry (Admin Only)
1. In Restrictions section, click "หมดอายุ" in Column 1
2. Click "+" on user in Column 2
3. Select date in popup, click "ตั้งวันหมดอายุ"
4. Click [Save Changes] at page level

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
**Updated:** 2026-03-18 (v6.0 — Unified 3-Column, No Tabs)
**Designer:** Development Team
**Version:** 6.0
