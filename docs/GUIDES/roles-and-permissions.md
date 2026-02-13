# 🔐 Roles & Permissions Guide

> **Document Status:** Single Source of Truth for Roles & Access Control  
> **Last Updated:** 2024-01-27  
> **Document Owner:** Development Team  
> **Version:** 3.0 (Contextual INTERSECT Architecture)

**StreamHub Role-Based Access Control (RBAC) with Structured Permissions (Direct + Company-Scoped)**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Permission Structure](#permission-structure)
4. [Access Logic](#access-logic)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Use Cases & Examples](#use-cases--examples)
7. [Implementation Checklist](#implementation-checklist)

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
- ❌ Create/Edit/Delete dashboards
- ❌ Create/Manage folders
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

### 2️⃣ MODERATOR (中级权限)

**Definition:** Team lead or manager who can manage dashboards and subfolders within assigned folders

**Permissions:**
- ✅ View all dashboards (in company scope)
- ✅ Create/Edit/Delete subfolders (in assigned folders)
- ✅ Set subfolder permissions (in assigned folders)
- ✅ Create/Edit/Delete dashboards (in assigned folders)
- ✅ Set dashboard permissions (in assigned folders)
- ✅ View activity logs (in company)
- ❌ Invite users
- ❌ Manage users (remove, role change)
- ❌ Create company-level folders
- ❌ Access other companies' folders

**Access Scope:**
- **Own Company:** Full management of assigned folders
- **Assigned Folders:** Only folders explicitly assigned
- **Other Companies:** No access
- **Cross-Company:** No cross-company dashboard creation

**Example:**
```
Moderator: นายหา (STTH)
├── Company: STTH
├── Role: Moderator
├── Assigned Folders: ["Operations", "Reports"]
├── Can:
│   ├── ✅ View all dashboards in STTH
│   ├── ✅ Create subfolder in Operations
│   ├── ✅ Create dashboard in assigned folders
│   ├── ✅ Edit/Delete own dashboards
│   └── ✅ Set permissions for dashboards
└── Cannot:
    ├── Access STTN, STCS folders
    ├── Create top-level folders
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

## 🔐 Permission Structure

**This section is the SINGLE SOURCE OF TRUTH for permissions.**

---

### Dashboard Access Structure

Dashboards use a **structured 3-layer permission model**:

```firestore
/dashboards/{dashboardId}
  ├── title: string
  ├── company: string          // REQUIRED: Dashboard owner (STTH, STTN, etc.)
  ├── folder: string
  │
  ├── access: {
  │   // ============================================================
  │   // Layer 1: Direct Access (Standalone OR - no restrictions)
  │   // ============================================================
  │   direct: {
  │     "uid:uid-1": ["view"],
  │     "uid:uid-2": ["view"],
  │     "group:board_members": ["view"],  // Cross-company groups OK
  │     "role:admin": ["view", "edit", "delete"]
  │   },
  │   
  │   // ============================================================
  │   // Layer 2: Company-Scoped Access (AND with company - secure)
  │   // ============================================================
  │   company: {
  │     "STTH": {
  │       "role:user": ["view"],
  │       "role:moderator": ["view", "edit"],
  │       "group:finance": ["view", "edit"]
  │     },
  │     "STTN": {
  │       "role:user": ["view"],
  │       "group:finance": ["view"]
  │     }
  │   }
  │ },
  │
  ├── restrictions: {
  │   revoke: ["uid:uid-5"],               // Explicitly deny
  │   expiry: {
  │     "uid:uid-6": "2024-02-22T23:59:59Z" // Auto-revoke after date
  │   }
  │ }
  │
  └── metadata: {
      createdBy: string
      createdAt: timestamp
      updatedAt: timestamp
    }
```

---

### Permission Levels

All access fields use this array:

```typescript
type Permission = "view" | "edit" | "delete"

// Examples:
"uid:uid-1": ["view"]                      // View only
"group:finance": ["view", "edit"]           // View + Edit
"role:admin": ["view", "edit", "delete"]    // Full access
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

### Contextual INTERSECT (Layer-Based)

**Layer 1: Direct Access (Standalone OR)**
```
User CAN ACCESS if:
  "uid:{userId}" in access.direct
  OR "role:admin" in access.direct
  OR userInDirectGroups()
  
(No company filter for direct access)
```

**Layer 2: Company-Scoped (AND with company)**
```
User CAN ACCESS if:
  (
    "role:{userRole}" in access.company[userCompany]
    OR "group:{userGroup}" in access.company[userCompany]
  )
  AND userCompany EXISTS in access.company
  
(MUST have both role/group AND company match)
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
  (direct["uid:" + uid] != null)
  OR (direct["role:admin"] != null)
  OR isUserInDirectGroups()
  
  // Layer 2: Company-Scoped (AND)
  OR (
    company[userCompany] != null
    AND (
      company[userCompany]["role:" + role] != null
      OR isUserInCompanyGroups()
    )
  )
  
  // Layer 3: Restrictions (AND NOT)
  AND !isRevoked(uid, restrictions.revoke)
  AND !isExpired(uid, restrictions.expiry);
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

### Phase 2: Firestore Rules
- [ ] Implement Layer 1 rules (direct)
- [ ] Implement Layer 2 rules (company-scoped)
- [ ] Implement Layer 3 rules (restrictions)
- [ ] Test all scenarios

### Phase 3: Pinia Stores
- [ ] Create `stores/permissions.ts`
- [ ] Implement permission checking functions
- [ ] Load user groups on login

### Phase 4: UI Components
- [ ] Create permission guard components
- [ ] Update dashboard list filtering
- [ ] Add permission indicators

---

## 📚 Related Documents

- [Database Schema](./database-schema.md) - For field definitions, **see Permission Structure section above**
- [Firestore Setup](./firestore-setup.md) - For setup, **see Firestore Security Rules section above**
- [Company Management](./company-management.md) - For company setup, **see Use Cases section above**
- [User Flows](../DESIGN/user-flows.md) - For access flow diagrams

---

**Last Updated:** 2024-01-27  
**Version:** 3.0 (Contextual INTERSECT + Mixed Permissions)
