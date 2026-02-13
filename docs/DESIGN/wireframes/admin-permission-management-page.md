# Admin Permission Management Page

> **Purpose:** Admin panel for managing 3-layer permissions for dashboards
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/permissions.vue`
> **Last Updated:** 2026-02-13
> **Version:** 4.0 (Consolidated with Single Source of Truth)

---

## 🎯 Key Principle

**Admin Panel = Dedicated space for complex permission management**
- Separate from Discover page
- Full 3-layer permission UI
- Admin-only access with audit trail
- Support for bulk operations

---

## 🏗️ Page Structure

### Layout
- Uses: AdminLayout or AppLayout
- Left: Admin navigation sidebar
- Right: Permission editor (3 layers)

### Components
- PermissionEditor (main component)
- Layer1DirectAccess
- Layer2CompanyScoped
- Layer3Restrictions
- CompanyAccessCard
- PermissionItem

---

## 📂 Admin Sidebar Navigation

```
ADMIN PANEL MENU

🏠 Home

━━ MANAGEMENT ━━
📊 Dashboards
   Search & select dashboard

📋 Folders
   Manage folder permissions

👥 Users
   Manage users & roles

🔐 Permissions
   ├─ Direct Access
   ├─ Company-Scoped
   └─ Restrictions

━━ REPORTS ━━
📊 Audit Log
   View permission changes
```

---

## 🎨 Permission Editor (Right Pane)

### Header Section

```
Dashboard: Sales East Performance
Owner: John (Moderator)
Created: 2024-01-15 | Modified: 2024-02-01
Current Access: 4 users + 3 groups
```

**Shows:**
- Dashboard name
- Owner information
- Metadata (created/modified dates)
- Quick access stats

---

### Layer 1: Direct Access

**Feature:** Add individual users, roles, or groups

**Actions:**
- [+] Add User - Grant direct access to specific user
- [+] Add Role - Any user with this role can access
- [+] Add Group - Any user in this group can access

**Each Item Shows:**
- Name (user/role/group)
- Granted date and by whom
- [Details] [Edit] [Delete] actions

**Logic:** (user_uid OR user_role OR user_group) = Access Granted

---

### Layer 2: Company-Scoped Access

**Feature:** Grant access based on user's company + role/group

**For Each Company:**
- Company selector: [STTH ▼]
- Roles checklist: ☑️ user, ☐ moderator, ☐ admin
- Groups checklist: ☑️ sales, ☑️ finance, ☐ operations

**Each Company Shows:**
- List of roles that can access
- List of groups that can access
- Summary: "X users can access"

**Actions:**
- [+ Add Company] - Add another company's access rules
- [Edit settings] - Modify role/group access
- [Delete] - Remove company access

**Logic:** (company + (role OR group)) = Access Granted

**Full Details:** See [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md)

---

### Layer 3: Restrictions (Deny + Expiry)

**Feature:** Explicit deny and time-based access revocation

**Revoked Access:**
- [+] Revoke User - Block specific user permanently
- Shows: User, revocation date, reason, [Restore] [Delete]

**Expiry Dates:**
- [+] Add Expiry - Set temporary access with end date
- Shows: User/Group, expiry date, days remaining, [Edit] [Extend] [Remove]

**Logic:** (revoked OR expired) = Access Denied

---

## 🎯 Action Buttons

```
[💾 Save Changes]      - Save all permission modifications
[↻ Reset]              - Discard changes
[🗑️ Delete Dashboard]  - Delete dashboard entirely
[📋 Change Log]        - View permission change history
[👁️ Preview Access]    - See all users with current access
```

---

## 🔄 Common Admin Tasks

### Grant Direct Access to User
1. Click [+ Add User] in Layer 1
2. Search and select user
3. [Grant Access]
4. [Save Changes]

### Set Company-Wide Role Access
1. Navigate to Layer 2 - Company
2. Check role checkbox
3. System shows "X users will get access"
4. [Save Changes]

### Revoke Temporary Access
1. Click [Edit expiry] in Layer 3
2. Select: Extend, Remove expiry, or Revoke
3. [Save]

### Bulk Add Group Access
1. Navigate to Layer 2 - Company
2. Check multiple group checkboxes
3. System shows total user count
4. [Save Changes]

### Temporarily Block User
1. Click [+] in Layer 3 - Revoked Access
2. Enter reason: "Investigation ongoing"
3. [Revoke]
4. Later: Click [Restore] to restore access

---

## 📱 Responsive Design

- **Desktop (>1024px):** Full sidebar + full editor
- **Tablet (768-1024px):** Collapsible sidebar + editor
- **Mobile (<768px):** Not recommended (too complex for mobile)

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Permissions Guide** | Complete 3-layer permission logic | [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **Discover Page** | User dashboard discovery view | [dashboard-discover-page.md](./dashboard-discover-page.md) |
| **Quick Share** | Moderator quick share dialog | [moderator-quick-share-dialog.md](./moderator-quick-share-dialog.md) |
| **Design System** | Colors, typography, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |
| **Database Schema** | Permission data structure | [database-schema.md](../../GUIDES/database-schema.md) |

---

## ✨ Key Differences from v3.x

- ✅ Consolidated from 716 lines to ~300 lines (58% reduction)
- ✅ Removed verbose ASCII wireframes
- ✅ Removed permission logic code examples (link to roles-and-permissions.md)
- ✅ Removed implementation checklists and component breakdown
- ✅ Removed workflow diagrams and examples
- ✅ Kept essential UI structure and admin actions
- ✅ Added cross-references (Single Source of Truth)
- ✅ Simplified to focus on purpose and features

---

**Created:** 2024-02-03
**Updated:** 2026-02-13 (v4.0 - Consolidated & Simplified)
**Designer:** Development Team
**Version:** 4.0
