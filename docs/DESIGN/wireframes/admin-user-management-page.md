# Admin User Management Page

> **Purpose:** Manage users across all companies (CRUD operations, role assignment, invitations)
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/users/index.vue` (to be created)
> **Last Updated:** 2026-02-14
> **Version:** 1.0

---

## 🎯 Key Principle

**User Management = Search, Filter, Edit, Invite**
- View all users with company/role filters
- Quick actions (edit, delete, resend invitation)
- Bulk invite functionality
- Role and company assignment

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with admin navigation sidebar
- Header: Breadcrumb + page title
- Content: Filter bar + User table + pagination

**Key Components:**
- `UserTable` - List of users with actions
- `UserFilterBar` - Filter by company, role, status
- `UserModal` - Add/edit user modal
- `BulkInviteDialog` - Send bulk invitations

---

## 🎨 Page Layout

```
┌──────────────────────────────────────────────────────┐
│  👥 User Management                    [➕ Add User] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Filter: [Company▼] [Role▼] [Status▼] [Search...] │
│                                                      │
│  149 users found                  [Bulk Invite]    │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ Name        Email           Role      Company   ││
│  ├─────────────────────────────────────────────────┤│
│  │ John Admin  john@ex.com    Admin     -         ││
│  │ Sarah M.    sarah@ex.com   Moderator STTH      ││
│  │ Bob User    bob@ex.com     User      STTN      ││
│  │ [Edit][Delete] [More]      [Details]          ││
│  │                                                 ││
│  │ Alice U.    alice@ex.com   User      STTH      ││
│  │ [Edit][Delete] [More]      [Details]          ││
│  │                                                 ││
│  │ Pending Invitations (3):                       ││
│  │ - jane@ex.com (Invited 2 days ago)  [Resend]  ││
│  │                                                 ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  [← Previous]  Page 1 of 6  [Next →]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎛️ Filter & Search Section

**Filters:**
- **Company:** Dropdown (All, STTH, STTN, STCS, etc.)
- **Role:** Dropdown (All, User, Moderator, Admin)
- **Status:** Dropdown (All, Active, Pending Invite, Inactive)
- **Search:** Search by name or email

**Results:** Shows count and pagination

---

## 👤 User Table

### Columns

| Column | Content | Actions |
|--------|---------|---------|
| **Name** | User display name | Click to view details |
| **Email** | User email | Sortable |
| **Role** | User, Moderator, Admin | Clickable to change |
| **Company** | Company code (STTH, STTN, etc.) | - |
| **Status** | Active, Pending, Inactive | Filter by this |
| **Actions** | Edit, Delete, More | [Edit] [Delete] [⋮] |

### Row Actions

- **[Edit]** → Open Add/Edit User modal
- **[Delete]** → Show confirmation, remove user
- **[⋮ More]** → Additional actions (resend invite, deactivate, etc.)

### Pending Invitations Section

Shows users who have been invited but haven't accepted yet:
- Email address
- Days since invitation sent
- [Resend] button to resend email

---

## 🪟 Add/Edit User Modal

```
┌────────────────────────────────────┐
│  Add New User              [X]     │
├────────────────────────────────────┤
│                                    │
│  Email:                            │
│  [john.doe@company.com]            │
│                                    │
│  Display Name:                     │
│  [John Doe]                        │
│                                    │
│  Role:                             │
│  ◉ User   ○ Moderator   ○ Admin   │
│                                    │
│  Company:                          │
│  [STTH ▼]                          │
│                                    │
│  Assigned Folders: (if Moderator) │
│  [Select folders...]              │
│                                    │
│  Status:                           │
│  ☑ Active                          │
│                                    │
│  [Save User] [Cancel]              │
│                                    │
└────────────────────────────────────┘
```

**Fields:**
- **Email:** User email (required, unique)
- **Display Name:** Full name (required)
- **Role:** User, Moderator, or Admin (required)
- **Company:** Company assignment (required for User/Moderator, N/A for Admin)
- **Assigned Folders:** For Moderators only (optional)
- **Status:** Active/Inactive toggle

**Actions:**
- **[Save User]** → Save changes to Firestore
- **[Cancel]** → Close modal

---

## 📬 Bulk Invite Dialog

```
┌────────────────────────────────────┐
│  Bulk Invite Users         [X]     │
├────────────────────────────────────┤
│                                    │
│  Paste email addresses:            │
│  [john@ex.com, jane@ex.com]       │
│  [sarah@ex.com, bob@ex.com]       │
│                                    │
│  Default Role:                     │
│  ◉ User   ○ Moderator   ○ Admin   │
│                                    │
│  Default Company:                  │
│  [STTH ▼]                          │
│                                    │
│  Send invitations to 4 emails?     │
│                                    │
│  [Send Invites] [Cancel]           │
│                                    │
└────────────────────────────────────┘
```

**Features:**
- Paste multiple emails (comma or newline separated)
- Set default role for all invites
- Set default company for all invites
- Confirmation before sending

---

## 🔄 User Status & Actions

| Status | Description | Actions |
|--------|-------------|---------|
| **Active** | User exists, logged in before | Edit, Delete, Deactivate |
| **Pending** | Invitation sent, not accepted | Edit, Resend Invite, Cancel |
| **Inactive** | User deactivated by admin | Reactivate, Delete |
| **New** | Just created, not invited yet | Send Invite, Edit, Delete |

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
| **Admin Dashboard** | Admin overview page | [admin-dashboard-home-page.md](./admin-dashboard-home-page.md) |
| **Admin Permissions** | Permission management | [admin-permission-management-page.md](./admin-permission-management-page.md) |
| **Folder Management** | Folder CRUD page | [admin-folder-management-page.md](./admin-folder-management-page.md) |
| **Company Management** | Company CRUD page | [admin-company-management-page.md](./admin-company-management-page.md) |
| **Permissions Guide** | Role and permission logic | [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
