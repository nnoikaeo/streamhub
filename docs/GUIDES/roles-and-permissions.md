# 🔐 Roles & Permissions Guide

> **Document Status:** Single Source of Truth for Roles & Access Control
> **Last Updated:** 2026-03-18
> **Document Owner:** Development Team
> **Version:** 6.0 (Unified 3-Column Inline + Folder Permissions + Provenance)

**StreamHub Role-Based Access Control (RBAC) with Simplified Permissions (Direct + Company-Scoped)**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Moderator Dual-View Model](#moderator-dual-view-model)
4. [Tag Permissions](#tag-permissions)
5. [Permission Structure](#permission-structure)
6. [Access Logic](#access-logic)
7. [Firestore Security Rules](#firestore-security-rules)
8. [Use Cases & Examples](#use-cases--examples)
9. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Overview

**StreamHub** uses **Contextual INTERSECT architecture** for role-based access control:

```
┌─────────────────────────────────────────┐
│          ROLE HIERARCHY                 │
├─────────────────────────────────────────┤
│                                         │
│              ADMIN                      │
│   ├─ Global access (all companies)      │
│   ├─ No company restrictions            │
│   └─ Manage everything                  │
│                                         │
│           MODERATOR                     │
│   ├─ Company-scoped access              │
│   ├─ Manage assigned folders            │
│   └─ Create/Edit dashboards             │
│                                         │
│              USER                       │
│   ├─ Company-scoped access              │
│   ├─ View-only dashboards               │
│   └─ Based on permissions               │
│                                         │
└─────────────────────────────────────────┘
```

**Key Principle:**
> Access control uses **Contextual INTERSECT**: Role + Company are AND'ed together (security first), while different layers are OR'ed (flexibility).

---

## 👥 Role Definitions

### 1️⃣ USER (基本权限)

**Definition:** Regular employee who can view dashboards based on assigned permissions

**Permissions:**
- ✅ View dashboards (with access rights)
- ✅ View own profile
- ✅ Update own profile (limited)
- ✅ Search and filter dashboards (by tag, by folder)
- ✅ View tags on dashboards (read-only)
- ❌ Create/Edit/Delete dashboards
- ❌ Create/Manage folders
- ❌ Assign/Manage tags
- ❌ Invite users
- ❌ Manage permissions

**Access Scope:**
- **Own Company:** Can view dashboards in their company
- **Other Companies:** Only if explicitly shared
- **Folders:** Can browse assigned folders (read-only)

**Example:**
```
User: สมชาย (STTH)
├── Company: STTH
├── Role: User
├── Can view:
│   ├── STTH Sales Dashboard (company-scoped)
│   ├── Group Overview (cross-company group)
│   └── Special Report (individual UID)
└── Cannot:
    ├── Edit dashboards
    ├── Create new dashboard
    ├── Invite users
    └── Manage folders
```

**Use Cases:**
- 📱 Sales Representative
- 💰 Accounting Staff
- 👥 Officer
- ⚙️ Engineer

---

### 2️⃣ MODERATOR (Dual-View Model)

**Definition:** Team lead or manager with **2 views**: Viewer mode (like User) and Manager mode (like limited Admin)

**View 1 — Viewer Mode (via "Dashboard" menu):**
- ✅ View dashboards (with access rights) — same as User
- ✅ Search and filter dashboards (by tag, by folder)
- ✅ View tags on dashboards (read-only)
- ❌ Create/Edit/Delete dashboards
- ❌ Assign tags

**View 2 — Manager Mode (via "จัดการ" menu → `/manage/explorer`):**
- ✅ Create/Edit/Delete subfolders (in assigned folders)
- ✅ Set subfolder permissions (in assigned folders)
- ✅ Create/Edit/Delete dashboards (in assigned folders)
- ✅ Set dashboard permissions — Layer 1 (Direct) + Layer 2 (Company) for all companies
- ✅ Assign/unassign tags to dashboards (select from existing tags)
- ✅ Move dashboards between assigned folders
- ✅ View activity logs (in company)
- ✅ Access `/manage/explorer` (unified folder + dashboard management)
- ✅ Access `/manage/permissions` (via 🔑 button in explorer)
- ❌ Set Layer 3 restrictions (Admin only)
- ❌ Create new tags (Admin only)
- ❌ Edit/Delete tags (Admin only)
- ❌ Invite users
- ❌ Manage users (remove, role change)
- ❌ Create company-level folders
- ❌ Access other companies' folders

**Access Scope:**
- **Own Company:** Full management of assigned folders
- **Assigned Folders:** Only folders explicitly assigned
- **Other Companies:** No access
- **Cross-Company:** No cross-company dashboard creation
- **Tags:** Read all tags, assign only in assigned folders

**Example:**
```
Moderator: นายหา (STTH)
├── Company: STTH
├── Role: Moderator
├── Assigned Folders: ["Operations", "Reports"]
│
├── View 1 (Viewer Mode):
│   ├── ✅ View all accessible dashboards in STTH
│   ├── ✅ Search dashboards
│   ├── ✅ Filter by tags
│   └── ❌ No edit/create/delete actions
│
├── View 2 (Manager Mode):
│   ├── ✅ Create subfolder in Operations
│   ├── ✅ Create dashboard in assigned folders
│   ├── ✅ Edit/Delete own dashboards
│   ├── ✅ Set permissions for dashboards
│   ├── ✅ Assign tags: [Sales, KPI, Monthly] to dashboards
│   └── ✅ Move dashboard from Operations → Reports
│
└── Cannot:
    ├── Access STTN, STCS folders
    ├── Create top-level folders
    ├── Create/Edit/Delete tags
    ├── Invite new users
    └── Manage other moderators
```

**Use Cases:**
- 🏢 Department Head
- 📊 Data Analyst
- 📈 Report Manager
- 💼 Team Lead

---

### 3️⃣ ADMIN (最高权限)

**Definition:** System administrator with global access across all companies

**Permissions:**
- ✅ View all dashboards (all companies)
- ✅ Create/Edit/Delete dashboards (all companies)
- ✅ Set dashboard permissions (all companies)
- ✅ Create/Edit/Delete folders (all companies)
- ✅ Assign folders to moderators
- ✅ Create/Edit/Delete tags (global tag management)
- ✅ Assign tags to any dashboard
- ✅ Invite users (all companies)
- ✅ Edit user profiles (all companies)
- ✅ Change user roles (all companies)
- ✅ Remove users (all companies)
- ✅ View activity logs (all companies)
- ✅ View system settings
- ✅ Configure Looker Studio integrations

**Access Scope:**
- **Global:** All companies, all folders, all dashboards
- **No Restrictions:** Company field doesn't restrict admin access
- **Full Control:** Can manage everything in the system

---

## 🔀 Moderator Dual-View Model

Moderators operate in **2 distinct views**, switching via sidebar navigation:

```
┌─────────────────────────────────────────────────────────────┐
│                      MODERATOR                              │
│                                                             │
│    ┌─────────────────────┐     ┌─────────────────────────┐ │
│    │  View 1: Viewer     │     │  View 2: Manager        │ │
│    │  (Dashboard menu)   │     │  (จัดการ menu)           │ │
│    │                     │     │                          │ │
│    │  Same as User:      │     │  Limited Admin:          │ │
│    │  - View dashboards  │     │  - CRUD dashboards      │ │
│    │  - Search           │     │  - CRUD subfolders      │ │
│    │  - Filter by tag    │     │  - Assign tags          │ │
│    │  - Read-only        │     │  - Set permissions L1+L2│ │
│    │                     │     │  - Move dashboards      │ │
│    │  No edit/create     │     │  Only in assignedFolders│ │
│    └─────────────────────┘     └─────────────────────────┘ │
│                                                             │
│    Sidebar:                                                 │
│    ▾ แดชบอร์ด          ← View 1 (Viewer)                   │
│      ├ 🏠 หน้าแรก                                           │
│      └ 📊 แดชบอร์ดทั้งหมด                                    │
│    ▾ จัดการ            ← View 2 (Manager)                   │
│      └ 📁 Explorer      (/manage/explorer)                  │
│                                                             │
│    Note: /manage/permissions accessible via 🔑 buttons      │
│    in explorer (on dashboard rows and search results)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Permission check flow:**
```
Moderator clicks item
    │
    ▼
Is item in assignedFolders?
    │
   YES → Which view?
    │     │
    │    View 1 (Dashboard) → Read-only (view, search, filter)
    │    View 2 (จัดการ)    → Full CRUD + tag assign + permissions (L1+L2)
    │
   NO → View 1 behavior only (read-only, if has access permission)
```

---

## 🏷️ Tag Permissions

Tags use a separate permission model from dashboards:

### Tag Permission Matrix

| Action | User | Moderator (View 1) | Moderator (View 2) | Admin |
|---|---|---|---|---|
| **View tags on dashboards** | ✅ | ✅ | ✅ | ✅ |
| **Filter by tags** | ✅ | ✅ | ✅ | ✅ |
| **Assign tags to dashboard** | ❌ | ❌ | ✅ (assigned folders) | ✅ (all) |
| **Unassign tags from dashboard** | ❌ | ❌ | ✅ (assigned folders) | ✅ (all) |
| **Create new tags** | ❌ | ❌ | ❌ | ✅ |
| **Edit tags** | ❌ | ❌ | ❌ | ✅ |
| **Delete tags** | ❌ | ❌ | ❌ | ✅ |

### Feature Permissions (Updated)

```typescript
interface FeaturePermissions {
  // Dashboard permissions
  canViewDashboards: boolean
  canCreateDashboard: boolean
  canEditDashboard: boolean
  canDeleteDashboard: boolean
  canShareDashboard: boolean

  // Folder permissions
  canCreateFolder: boolean
  canEditFolder: boolean
  canDeleteFolder: boolean

  // Tag permissions (NEW)
  canManageTags: boolean        // Create/Edit/Delete tags (Admin only)
  canAssignTags: boolean        // Assign/unassign tags to dashboards

  // Admin permissions
  canAccessAdmin: boolean
  canManageUsers: boolean
}
```

### Role → Permission Mapping (Updated)

```typescript
const ROLE_PERMISSIONS = {
  admin: {
    canViewDashboards: true,
    canCreateDashboard: true,
    canEditDashboard: true,
    canDeleteDashboard: true,
    canShareDashboard: true,
    canCreateFolder: true,
    canEditFolder: true,
    canDeleteFolder: true,
    canManageTags: true,         // ✅ Admin only
    canAssignTags: true,         // ✅
    canAccessAdmin: true,
    canManageUsers: true,
  },
  moderator: {
    canViewDashboards: true,
    canCreateDashboard: true,    // In assigned folders only
    canEditDashboard: true,      // In assigned folders only
    canDeleteDashboard: true,    // In assigned folders only
    canShareDashboard: true,
    canCreateFolder: true,       // Subfolders in assigned folders
    canEditFolder: true,         // In assigned folders only
    canDeleteFolder: false,      // Cannot delete root folders
    canManageTags: false,        // ❌ Cannot create/edit/delete tags
    canAssignTags: true,         // ✅ In assigned folders only
    canAccessAdmin: false,
    canManageUsers: false,
  },
  user: {
    canViewDashboards: true,
    canCreateDashboard: false,
    canEditDashboard: false,
    canDeleteDashboard: false,
    canShareDashboard: false,
    canCreateFolder: false,
    canEditFolder: false,
    canDeleteFolder: false,
    canManageTags: false,        // ❌
    canAssignTags: false,        // ❌
    canAccessAdmin: false,
    canManageUsers: false,
  }
}
```

---

## 🔐 Permission Structure

**This section is the SINGLE SOURCE OF TRUTH for permissions.**

---

### Dashboard / Folder Access Structure (v6.0)

Dashboards and folders use a **simplified 3-layer permission model**:

```typescript
// Layer 1: Direct Access
interface DirectAccess {
  users: string[]   // User UIDs (direct grant)
  groups: string[]  // Group IDs (cross-company groups OK)
}

// Layer 2: Company-Scoped Access
// Selecting a company = ALL users in that company get access
type CompanyAccess = string[]  // Company IDs e.g. ["STTH", "STTN"]

// Combined
interface AccessControl {
  direct: DirectAccess
  company: CompanyAccess
}

// Layer 3: Restrictions (Explicit Deny)
interface AccessRestrictions {
  revoke: string[]   // UIDs explicitly denied
  expiry: { [userId: string]: Date }  // Time-limited access
}
```

**Permission Metadata** (provenance tracking):

```typescript
interface PermissionMetadata {
  setBy: string      // UID of the user who set the permission
  setByName?: string // Display name (denormalized)
  setAt: string      // ISO date string
}
```

**Folder-level Permissions** (v6.0):

```typescript
interface Folder {
  // ... existing fields ...
  access?: AccessControl           // Optional folder-level permissions
  restrictions?: AccessRestrictions
  inheritPermissions?: boolean     // Default false — when true, cascades to all dashboards
  permissionMeta?: PermissionMetadata
}
```

**OR-merge rule:**
```
Final access = (DashboardPerms OR FolderPerms) AND NOT (DashboardRestrictions OR FolderRestrictions)
```

**Changes from v5.0:**
- `direct.roles[]` removed — roles no longer used in direct access
- `company` changed from `{ [companyId]: { roles, groups } }` → `string[]`
- Selecting a company grants access to ALL users in that company (no group/role filter)
- New: `permissionMeta` for provenance tracking
- New: `Folder.inheritPermissions` for folder-level cascade

---

### Groups Collection (Reusable)

Groups are shared across dashboards:

```firestore
/groups/{groupId}
  ├── name: string             // "Finance Team"
  ├── description: string
  ├── members: array           // Array of UIDs
  │   ├── "uid:uid-1"
  │   ├── "uid:uid-2"
  │   └── "uid:uid-3"
  ├── createdBy: string
  ├── createdAt: timestamp
  └── metadata: { ... }

// Benefits:
// - 1 UID can be in multiple groups
// - 1 group can be in multiple dashboards
// - Central member management
// - Automatic access when added to group
```

---

## ⚙️ Access Logic

### Access Logic (v6.0 — Simplified)

**Layer 1: Direct Access (OR)**
```
User CAN ACCESS if:
  userId in access.direct.users
  OR any of user.groups in access.direct.groups

(No company filter for direct access)
```

**Layer 2: Company-Scoped (simplified)**
```
User CAN ACCESS if:
  user.company in access.company

(Any user from a listed company gets access — no role/group filter needed)
```

**Layer 3: Restrictions (Explicit Deny)**
```
User CANNOT ACCESS if:
  userId in restrictions.revoke
  OR (userId in restrictions.expiry AND expiry < now())
```

**Final Access Decision:**
```javascript
allow read: if
  // Layer 1: Direct (OR)
  access.direct.users.includes(userId)
  OR user.groups.some(g => access.direct.groups.includes(g))

  // Layer 2: Company-Scoped
  OR access.company.includes(user.company)

  // Layer 3: Restrictions (AND NOT)
  AND !restrictions.revoke.includes(userId)
  AND !isExpired(userId, restrictions.expiry)
```

**Folder Inheritance:**
```javascript
// For each ancestor folder with inheritPermissions === true:
folderGrant = folderAccess.company.includes(user.company)
           || folderAccess.direct.users.includes(userId)
           || user.groups.some(g => folderAccess.direct.groups.includes(g))

// Final
finalAccess = (dashboardGrant OR folderGrant)
           AND NOT (dashboardRevoke OR folderRevoke)
```

---

## 🛡️ Firestore Security Rules

### Dashboard Rules (Complete)

```javascript
match /dashboards/{dashboardId} {
  let access = resource.data.access;
  let restrictions = resource.data.restrictions;
  let userRole = request.auth.token.role;
  let userCompany = request.auth.token.company;
  let userGroups = request.auth.token.groups;  // Array
  
  // =========================================
  // Read Access
  // =========================================
  allow read: if
    // Layer 1: Direct access (no restrictions)
    (access.direct["uid:" + request.auth.uid] != null)
    OR (access.direct["role:admin"] != null)
    OR isUserInDirectGroups(request.auth.uid, access.direct)
    
    // Layer 2: Company-scoped access (AND with company)
    OR (
      access.company[userCompany] != null
      AND (
        access.company[userCompany]["role:" + userRole] != null
        OR isUserInCompanyGroups(request.auth.uid, access.company[userCompany])
      )
    )
    
    // Layer 3: Check restrictions
    AND !isRevoked(request.auth.uid, restrictions.revoke)
    AND !isExpired(request.auth.uid, restrictions.expiry);
  
  // =========================================
  // Write Access (Edit)
  // =========================================
  allow write: if
    request.auth.uid == resource.data.createdBy
    OR (access.direct["uid:" + request.auth.uid] has "edit")
    OR (access.direct["role:admin"] has "edit")
    OR (
      access.company[userCompany] != null
      AND access.company[userCompany]["role:" + userRole] has "edit"
    );
  
  // =========================================
  // Delete Access
  // =========================================
  allow delete: if
    request.auth.token.role == "admin"
    OR (access.direct["uid:" + request.auth.uid] has "delete");
}

// =========================================
// Helper Functions
// =========================================

function isUserInDirectGroups(uid, directAccess) {
  return directAccess.keys().hasAny(
    getUserGroups(uid).map(g => "group:" + g)
  );
}

function isUserInCompanyGroups(uid, companyAccess) {
  return companyAccess.keys().hasAny(
    getUserGroups(uid).map(g => "group:" + g)
  );
}

function getUserGroups(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.groups;
}

function isRevoked(uid, revokeList) {
  return uid in revokeList;
}

function isExpired(uid, expiryMap) {
  let expiry = expiryMap[uid];
  return expiry != null && expiry < request.time;
}
```

---

## 💡 Use Cases & Examples

### Example 1: Company-Specific Dashboard

```firestore
Dashboard: "STTH Daily Report"
├── company: "STTH"
├── access: {
│   company: {
│     "STTH": {
│       "role:user": ["view"],
│       "role:moderator": ["view", "edit"]
│     }
│   }
│ }

Access Results:
✅ somchai (STTH, role=user) → Can view
✅ nayha (STTH, role=moderator) → Can view & edit
❌ user1 (STTN, role=user) → Cannot view (company mismatch)
✅ admin → Can view & edit (admin override)
```

### Example 2: Group-Based Access

```firestore
Dashboard: "Finance Report"
├── company: "STTH"
├── access: {
│   company: {
│     "STTH": {
│       "group:finance": ["view", "edit"]
│     }
│   }
│ }

Access Results:
✅ user1 (STTH, groups=[finance]) → Can view & edit
❌ user2 (STTH, groups=[sales]) → Cannot view
❌ user3 (STTN, groups=[finance]) → Cannot view (company mismatch)
```

### Example 3: Cross-Company Group

```firestore
Dashboard: "Global Metrics"
├── company: null
├── access: {
│   direct: {
│     "group:executives": ["view"]
│   }
│ }

Access Results:
✅ ceo (STTH, groups=[executives]) → Can view
✅ cfo (STTN, groups=[executives]) → Can view
✅ director (STCS, groups=[executives]) → Can view
(Cross-company OK for global dashboards)
```

### Example 4: Individual + Expiry

```firestore
Dashboard: "Q1 Audit"
├── access: {
│   direct: {
│     "uid:auditor": ["view"]
│   }
│ },
├── restrictions: {
│   expiry: {
│     "uid:auditor": "2024-02-28T23:59:59Z"
│   }
│ }

Access Results:
✅ auditor (before 2024-02-28) → Can view
❌ auditor (after 2024-02-28) → Cannot view (expired)
```

---

## ✅ Implementation Checklist

### Phase 1: Database Schema
- [ ] Add `access.direct` to dashboards
- [ ] Add `access.company` to dashboards
- [ ] Add `restrictions` to dashboards
- [ ] Create `groups` collection
- [ ] Add `groups` array to users
- [ ] Create `tags` collection
- [ ] Add `tags: string[]` to dashboards

### Phase 2: Firestore Rules
- [ ] Implement Layer 1 rules (direct)
- [ ] Implement Layer 2 rules (company-scoped)
- [ ] Implement Layer 3 rules (restrictions)
- [ ] Implement tag collection rules (read: all auth, write: admin only)
- [ ] Test all scenarios

### Phase 3: Pinia Stores
- [ ] Create `stores/permissions.ts`
- [ ] Add `canManageTags` and `canAssignTags` to permissions
- [ ] Create `stores/tags.ts` (tag CRUD + filtering)
- [ ] Implement permission checking functions
- [ ] Load user groups on login

### Phase 4: UI Components
- [ ] Create permission guard components
- [ ] Update dashboard list filtering (add tag filter)
- [ ] Add permission indicators
- [ ] Create TagBadge, TagSelector, TagFilter, TagManager components
- [ ] Restructure sidebar navigation (role-based menus)
- [ ] Implement Moderator dual-view switching (Viewer/Manager)
- [x] Refactor PermissionEditor to 3-column pattern (3 tabs)
- [x] Create `/manage/permissions` page (moderator permission editor)
- [x] Create `/manage/explorer` page (unified folder + dashboard management, replaces separate dashboards/folders pages)
- [x] Create `/admin/explorer` page (admin file explorer with moderator assignment)
- [x] Create shared ExplorerPage + PermissionsPage components
- [x] Update moderator sidebar navigation → Explorer menu
- [x] Add 🔑 shortcut buttons in explorer → permissions page

---

## 📚 Related Documents

- [Database Schema](./database-schema.md) - For field definitions, **see Permission Structure section above**
- [Firestore Setup](./firestore-setup.md) - For setup, **see Firestore Security Rules section above**
- [Company Management](./company-management.md) - For company setup, **see Use Cases section above**
- [User Flows](../DESIGN/user-flows.md) - For access flow diagrams

---

**Last Updated:** 2026-03-18
**Version:** 6.0 (Unified 3-Column Inline + Folder Permissions + Provenance)
