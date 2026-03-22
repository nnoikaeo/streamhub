# 🔐 Roles & Permissions Guide

> **Document Status:** Single Source of Truth for Roles & Access Control
> **Last Updated:** 2026-03-22
> **Document Owner:** Development Team
> **Version:** 6.1 (Updated checklist to reflect Phase 1–4 completion)

**StreamHub Role-Based Access Control (RBAC) with Simplified Permissions (Direct + Company-Scoped)**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Moderator Dual-View Model](#moderator-dual-view-model)
4. [Tag Permissions](#tag-permissions)
5. [Permission Structure](#permission-structure)
6. [Folder-level Permissions](#folder-level-permissions)
7. [Access Logic](#access-logic)
8. [Conflict Detection](#conflict-detection)
9. [Effective Access Summary](#effective-access-summary)
10. [Firestore Security Rules](#firestore-security-rules)
11. [Use Cases & Examples](#use-cases--examples)
12. [Implementation Checklist](#implementation-checklist)

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

### 1️⃣ USER

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

### 3️⃣ ADMIN

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

**Changes from v5.0:**
- `direct.roles[]` removed — roles no longer used in direct access
- `company` changed from `{ [companyId]: { roles, groups } }` → `string[]`
- Selecting a company grants access to ALL users in that company (no group/role filter)
- New: `permissionMeta` for provenance tracking
- New: `Folder.inheritPermissions` for folder-level cascade

---

## 📁 Folder-level Permissions

Folders can optionally have their own permissions that cascade down to all dashboards inside.

### How It Works

- `inheritPermissions: boolean` (default `false`) — opt-in flag on each folder
- When `true`, the folder's `access` and `restrictions` are OR-merged with each dashboard's own permissions
- Ancestor chain is walked upward (child → parent → grandparent → root)

### OR-merge Rule

```
Final access = (DashboardPerms OR FolderPerms_ancestor1 OR FolderPerms_ancestor2 ...)
               AND NOT (DashboardRestrictions OR FolderRestrictions_ancestor1 ...)
```

Only ancestor folders with `inheritPermissions === true` are included.

### Permission Metadata (Provenance)

When permissions are saved on a folder or dashboard, `permissionMeta` records who set them:

```typescript
interface PermissionMetadata {
  setBy: string      // UID of the user who saved
  setByName?: string // Display name (denormalized)
  setAt: string      // ISO date string
}
```

This is displayed in the inherited permissions section as provenance info.

### Example

```
Root Folder (no permissions)
 └── Finance (inheritPermissions: true, company: ["STTH"])
      ├── Budget Dashboard ← inherits STTH access from Finance folder
      └── Revenue Dashboard (direct users: ["uid-1"]) ← has own + inherited
```

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

## ⚠️ Conflict Detection

The permission editor detects 3 types of conflicts and shows inline warnings:

### 1. Redundant Grant (`redundant-grant`)

A user has direct access but is already covered by a company or group rule.

**Example:** User "สมชาย" added individually, but company "STTH" is already granted → Redundant.

**Severity:** ℹ️ Info — not a problem, but wasteful.

### 2. Revoke vs Inherited Grant (`revoke-vs-inherited-grant`)

A user is revoked at the current level, but still has inherited access from a parent folder.

**Example:** User "สมชาย" revoked here, but folder "Finance" (ancestor) grants access.

**Severity:** ⚠️ Warning — revoke is applied at this level but inherited access may override.

### 3. Grant vs Inherited Revoke (`grant-vs-inherited-revoke`)

A user is granted access here, but revoked in an ancestor folder.

**Example:** User "สมชาย" granted access here, but revoked in folder "Finance" (ancestor).

**Severity:** ⚠️ Warning — OR-merge grants access, but inherited revoke blocks it.

---

## 📊 Effective Access Summary

The permissions page shows an expandable summary of the actual users who have access after all rules are resolved.

### How It Works

1. Collect all users from:
   - Direct users
   - Group members (expanded)
   - Company users (all users in selected companies)
   - Inherited folder permissions (recursively)
2. Deduplicate by UID
3. Remove restricted users (revoked + expired)
4. Display: **"ผลลัพธ์รวม: N คน มีสิทธิ์เข้าถึง"**
5. Expand to see each user with their source (e.g., "สิทธิ์ตรง", "กลุ่ม Finance", "บริษัท STTH", "📁 Finance")

---

## 🛡️ Firestore Security Rules

> **Note:** These rules will be updated when moving from mock data to real Firestore.
> The current implementation uses mock JSON APIs with server-side access checks.

### Dashboard Rules (v6.0 Simplified)

```javascript
match /dashboards/{dashboardId} {
  let access = resource.data.access;
  let restrictions = resource.data.restrictions;
  let userCompany = request.auth.token.company;
  let userGroups = request.auth.token.groups;  // Array

  // =========================================
  // Read Access (v6.0 Simplified)
  // =========================================
  allow read: if
    // Layer 1: Direct access
    request.auth.uid in access.direct.users
    OR userGroups.hasAny(access.direct.groups)

    // Layer 2: Company-scoped (simplified — whole company)
    OR userCompany in access.company

    // Layer 3: Check restrictions
    AND !(request.auth.uid in restrictions.revoke)
    AND !isExpired(request.auth.uid, restrictions.expiry);

  // =========================================
  // Write Access (Edit)
  // =========================================
  allow write: if
    request.auth.token.role == "admin"
    OR request.auth.uid == resource.data.owner;

  // =========================================
  // Delete Access
  // =========================================
  allow delete: if
    request.auth.token.role == "admin"
    OR request.auth.uid == resource.data.owner;
}

// =========================================
// Helper Functions
// =========================================

function isExpired(uid, expiryMap) {
  let expiry = expiryMap[uid];
  return expiry != null && expiry < request.time;
}
```

---

## 💡 Use Cases & Examples

### Example 1: Company-Specific Dashboard (v6.0)

```
Dashboard: "STTH Daily Report"
access: {
  direct: { users: [], groups: [] },
  company: ["STTH"]
}
restrictions: { revoke: [], expiry: {} }

Access Results:
✅ somchai (STTH) → Can view (company match)
✅ nayha (STTH) → Can view (company match)
❌ user1 (STTN) → Cannot view (company mismatch)
✅ admin → Can view (admin override)
```

### Example 2: Group-Based Access (v6.0)

```
Dashboard: "Finance Report"
access: {
  direct: { users: [], groups: ["finance-team"] },
  company: []
}

Group "finance-team": members = ["uid-1", "uid-2", "uid-3"]

Access Results:
✅ uid-1 (groups=[finance-team]) → Can view (group match)
✅ uid-2 (groups=[finance-team]) → Can view (group match)
❌ uid-4 (groups=[sales]) → Cannot view (no match)
```

### Example 3: Cross-Company Group (v6.0)

```
Dashboard: "Global Metrics"
access: {
  direct: { users: [], groups: ["executives"] },
  company: []
}

Group "executives": members = ["ceo-stth", "cfo-sttn", "director-stcs"]

Access Results:
✅ ceo-stth (STTH, groups=[executives]) → Can view
✅ cfo-sttn (STTN, groups=[executives]) → Can view
✅ director-stcs (STCS, groups=[executives]) → Can view
(Cross-company OK — groups are not company-scoped)
```

### Example 4: Individual + Expiry (v6.0)

```
Dashboard: "Q1 Audit"
access: {
  direct: { users: ["uid-auditor"], groups: [] },
  company: []
}
restrictions: {
  revoke: [],
  expiry: { "uid-auditor": "2024-02-28T23:59:59Z" }
}

Access Results:
✅ uid-auditor (before 2024-02-28) → Can view
❌ uid-auditor (after 2024-02-28) → Cannot view (expired)
```

### Example 5: Folder Inheritance (v6.0)

```
Folder: "Finance" (inheritPermissions: true)
access: {
  direct: { users: [], groups: [] },
  company: ["STTH"]
}
permissionMeta: { setBy: "admin-1", setByName: "Admin", setAt: "2026-03-18" }

  └── Dashboard: "Budget Report" (no direct permissions)
      access: { direct: { users: ["uid-1"], groups: [] }, company: [] }

Effective access for "Budget Report":
✅ uid-1 → via direct user grant
✅ any STTH user → via inherited folder permission
```

---

## ✅ Implementation Checklist

### Phase 1: Database Schema ✅ COMPLETED
- [x] Add `access.direct` to dashboards — `DirectAccess` interface in `types/dashboard.ts`
- [x] Add `access.company` to dashboards — `CompanyAccess = string[]` in `types/dashboard.ts`
- [x] Add `restrictions` to dashboards — `AccessRestrictions` interface in `types/dashboard.ts`
- [x] Create `groups` collection — `.data/groups.json` + `server/api/mock/groups.*`
- [x] Add `groups` array to users — in mock users data
- [x] Create `tags` collection — `.data/tags.json` + `server/api/mock/tags/`
- [x] Add `tags: string[]` to dashboards — in `Dashboard` type (`types/dashboard.ts`)

### Phase 2: Firestore Rules ⏳ PENDING (Real Firebase)
> Current implementation uses mock JSON API (`server/api/mock/`). Rules below apply when migrating to real Firestore.
- [ ] Implement Layer 1 rules (direct)
- [ ] Implement Layer 2 rules (company-scoped — simplified string[])
- [ ] Implement Layer 3 rules (restrictions)
- [ ] Implement tag collection rules (read: all auth, write: admin only)
- [ ] Test all scenarios

### Phase 3: Pinia Stores ✅ COMPLETED
- [x] Create `stores/permissions.ts` — role-based permissions with `can()`, `hasAll()`, `hasAny()`
- [x] Add `canManageTags` and `canAssignTags` to permissions — defined per role in permissions store
- [x] Create `stores/tags.ts` — tag CRUD + `selectedTagIds` + filter toggle
- [x] Implement permission checking functions — `initializePermissions(user)` in permissions store
- [x] Load user groups on login — handled in `useAuth.ts`

### Phase 4: UI Components ✅ COMPLETED
- [x] Create permission guard components — permissions store used directly in components
- [x] Update dashboard list filtering — `TagFilter.vue` component implemented
- [x] Add permission indicators — role-based UI gating via permissions store
- [x] Create TagBadge, TagSelector, TagFilter, TagManager components — all in `components/dashboard/`; TagManager via `/admin/tags` page + `TagForm.vue`
- [x] Restructure sidebar navigation — `UnifiedSidebar.vue` + `useRoleNavigation.ts` composable
- [x] Implement Moderator dual-view switching — `useModeratorFolders` + `useModeratorDashboards` + `/manage/explorer`
- [x] Refactor PermissionEditor to unified 3-column layout (v6.0 — no tabs)
- [x] Create `/manage/permissions` page (moderator permission editor)
- [x] Create `/manage/explorer` page (unified folder + dashboard management)
- [x] Create `/admin/explorer` page (admin file explorer with moderator assignment)
- [x] Create shared ExplorerPage + PermissionsPage components
- [x] Update moderator sidebar navigation → Explorer menu
- [x] Add 🔑 shortcut buttons in explorer → permissions page

### Phase 5: Permission System v6.0 (Completed)
- [x] Part 1: Types (AccessControl simplified, PermissionMetadata), Mock Data
- [x] Part 2: Permission Algorithm (simplified company check, folder-aware)
- [x] Part 3: PermissionEditor.vue — Unified 3-Column (no tabs)
- [x] Part 4: PermissionsPage.vue — Inherited permissions, conflict detection, effective access, folder/dashboard mode toggle, provenance
- [x] Part 5: Services (saveFolderPermissions, getFolderPermissions, resolveEffectiveUsers)
- [x] Part 6: Cleanup + Documentation update

---

## 📚 Related Documents

- [Database Schema](./database-schema.md) - For field definitions, **see Permission Structure section above**
- [Company Management](./company-management.md) - For company setup, **see Use Cases section above**
- [User Flows](../DESIGN/user-flows.md) - For access flow diagrams

---

**Last Updated:** 2026-03-22
**Version:** 6.1 (Phase 1–4 checklist updated to reflect completed implementation)
