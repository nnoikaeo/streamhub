# Company Management Guide

> **Document Status:** Foundational Guide for Multi-Company Architecture  
> **Last Updated:** 2024-01  
> **Document Owner:** Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Company Structure](#company-structure)
3. [Company Codes](#company-codes)
4. [Admin Responsibilities](#admin-responsibilities)
5. [Company Setup Process](#company-setup-process)
6. [Database Structure](#database-structure)
7. [Access Control](#access-control)
8. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Overview

**Streamwash** operates as a **holding company** with **10+ subsidiary companies** (บริษัทในเครือ). Each subsidiary:
- Has its own separate **company code** (STTH, STTN, STCS, etc.)
- Manages its own **folders and dashboards**
- Has independent **user access control**
- Maintains **data isolation** from other companies

**Key Principle:** 
> Every user is assigned to a **specific company**. Folders and dashboards have a `company` field for organizational purposes. Access control is determined by **role** and **permissions**, not just the company field.

### Quick Reference: Role + Company Field

| Role | Company Field | Scope & Permissions |
|------|---------------|-------------------|
| **USER** | "STTH" | Employee of STTH - Can view dashboards in STTH that they have permission to access (via `dashboard.permissions`) |
| **MODERATOR** | "STTN" | Manager of STTN - Can manage folders assigned to them (via `folder.assignedModerators`) + create/edit dashboards in those folders |
| **ADMIN** | "STTH" | Employee of STTH (home company) - Can access and manage ALL companies, folders, and dashboards regardless of their `company` field value |

**Critical Distinction:**
- `company` field = **organizational assignment** (what company are they in?)
- **Role** + **Permissions** = **what can they do?** (determined by role + specific permissions)

---

## 🏢 Company Structure

### Subsidiary Companies

```
Streamwash Group
│
├── STTH (Streamwash Thailand)
│   ├── Departments: Operations, Finance, Sales, HR
│   ├── Employees: ~30-50
│   ├── Folders: Operations, Finance, Reports
│   └── Dashboards: 20+
│
├── STTN (Streamwash Laos)
│   ├── Departments: Operations, Finance, Sales
│   ├── Employees: ~20-30
│   ├── Folders: Operations, Finance
│   └── Dashboards: 10+
│
├── STCS (Streamwash Cambodia)
│   ├── Employees: ~15-20
│   ├── Folders: Operations, Reports
│   └── Dashboards: 8+
│
├── STNR (Streamwash Myanmar)
│   └── ...
│
├── STPT (Streamwash Vietnam)
│   └── ...
│
├── STPK (Streamwash Indonesia)
│   └── ...
│
└── ... (4+ more companies)
```

**Total:**
- **10+ subsidiary companies**
- **150+ employees** across all companies
- **100+ dashboards** total
- **30+ folders** total

---

## 📍 Company Codes

| Code | Company | Status |
|------|---------|--------|
| STTH | Streamwash Thailand | Active |
| STTN | Streamwash Laos | Active |
| STCS | Streamwash Cambodia | Active |
| STNR | Streamwash Myanmar | Active |
| STPT | Streamwash Vietnam | Active |
| STPK | Streamwash Indonesia | Active |
| STSG | Streamwash Singapore | TBD |
| STKH | Streamwash Hong Kong | TBD |
| STBR | Streamwash Brazil | TBD |
| STIN | Streamwash India | TBD |

---

## 👨‍💼 Admin Responsibilities

Admins are responsible for **company-level management**:

### 1. **Create & Configure Companies**
- Create new subsidiary company in Firestore
- Set company code (STTH, STTN, etc.)
- Define company metadata (name, location, department list)
- Set up initial folders for the company

### 2. **Manage Folders**
- Create company-level folders (marked with `company` field)
- Assign folders to moderators
- Manage folder permissions
- Delete folders when needed

### 3. **Manage Users**
- Invite users to specific companies
- Assign role: User, Moderator, or Admin
- Assign moderators to folders (if applicable)
- Remove users from company
- Change user roles

### 4. **Configure Access Control**
- Set up Firestore security rules
- Configure role-based permissions
- Manage cross-company access (admins only)
- Review activity logs for compliance

### 5. **Monitor System Health**
- View activity logs for all companies
- Monitor dashboard usage
- Ensure data isolation between companies
- Handle permission disputes

---

## 🔧 Company Setup Process

### Step 1: Create Company in Firestore

**Collection:** `/companies`

```firestore
/companies
  ├── stth
  │   ├── name: "Streamwash Thailand"
  │   ├── code: "STTH"
  │   ├── country: "Thailand"
  │   ├── location: "Bangkok"
  │   ├── createdAt: 2024-01-21
  │   ├── isActive: true
  │   └── metadata: {
  │       "parentCompany": "Streamwash Group",
  │       "departments": ["Operations", "Finance", "Sales", "HR"],
  │       "contact": "...@stth.com"
  │     }
  │
  ├── sttn
  │   ├── name: "Streamwash Laos"
  │   ├── code: "STTN"
  │   ├── country: "Laos"
  │   └── ...
  │
  └── ... (other companies)
```

### Step 2: Create Initial Folders

**Collection:** `/folders`

For each company, create main folders:

```firestore
/folders
  ├── folder_stth_operations
  │   ├── name: "Operations"
  │   ├── company: "STTH"          // MUST SPECIFY COMPANY
  │   ├── description: "Operations dashboards for STTH"
  │   ├── createdBy: "admin_uid"
  │   ├── createdAt: 2024-01-21
  │   └── subfolders: [...]
  │
  ├── folder_stth_finance
  │   ├── name: "Finance"
  │   ├── company: "STTH"
  │   └── ...
  │
  ├── folder_stth_reports
  │   ├── name: "Reports"
  │   ├── company: "STTH"
  │   └── ...
  │
  └── ... (repeat for other companies)
```

### Step 3: Invite Moderators

**Collection:** `/users`

```firestore
/users
  ├── uid_somchai
  │   ├── email: "somchai@stth.com"
  │   ├── displayName: "สมชาย"
  │   ├── role: "moderator"
  │   ├── company: "STTH"          // MUST SPECIFY COMPANY (moderator's company)
  │   ├── assignedFolders: [
  │   │   "folder_stth_operations",
  │   │   "folder_stth_reports"
  │   │ ]
  │   └── createdAt: 2024-01-21
  │
  └── ... (other users)
```

### Step 3b: Invite Admins

**Collection:** `/users`

Admins MUST have `company` field (their home company), but can access all companies:

```firestore
/users
  ├── uid_admin_thailand
  │   ├── email: "admin.thailand@streamwash.com"
  │   ├── displayName: "Admin Thailand"
  │   ├── role: "admin"
  │   ├── company: "STTH"          // Home company, but can access ALL companies
  │   ├── assignedFolders: []      // Admins don't need this (access everything)
  │   └── createdAt: 2024-01-21
  │
  ├── uid_admin_global
  │   ├── email: "admin.global@streamwash.com"
  │   ├── displayName: "Global Admin"
  │   ├── role: "admin"
  │   ├── company: "STTH"          // Still has a company field
  │   └── createdAt: 2024-01-21
  │
  └── ... (other users)
```

**KEY POINT:** Even admins have a `company` field! They just get cross-company access due to their `admin` role.

### Step 4: Invite Regular Users

```firestore
/users
  ├── uid_sunai
  │   ├── email: "sunai@stth.com"
  │   ├── displayName: "สุนัย"
  │   ├── role: "user"
  │   ├── company: "STTH"          // MUST SPECIFY COMPANY
  │   └── assignedFolders: []      // Users don't have assigned folders
  │
  └── ... (other users)
```

---

## 🗄️ Database Structure

### Companies Collection

```firestore
/companies/{companyCode}
  ├── name: string              // Company name
  ├── code: string              // Company code (STTH, STTN, etc.)
  ├── country: string           // Country location
  ├── location: string          // City/location
  ├── createdAt: timestamp      // When company was added to system
  ├── isActive: boolean         // Active/Inactive status
  └── metadata: map             // Additional info (departments, contact, etc.)
```

### Users Collection (Company-Scoped)

```firestore
/users/{userId}
  ├── email: string
  ├── displayName: string
  ├── photoURL: string
  ├── role: string              // "user" | "moderator" | "admin"
  ├── company: string           // Company code: "STTH", "STTN", "STCS", etc.
  │   // Required for all users - represents employee's home company
  ├── assignedFolders: array   // Only for moderators
  │   // ["folder_stth_operations", "folder_stth_finance"]
  ├── createdAt: timestamp
  ├── isActive: boolean
  └── lastLogin: timestamp
```

### Folders Collection (Company-Scoped)

```firestore
/folders/{folderId}
  ├── name: string
  ├── company: string            // REQUIRED! "STTH", "STTN", etc.
  ├── description: string
  ├── createdBy: string          // Admin UID
  ├── createdAt: timestamp
  ├── assignedModerators: array  // Moderators assigned to manage this folder
  │   ├── userId: string
  │   ├── name: string
  │   └── permissions: array
  ├── subfolders: array          // Nested subfolders
  │   ├── id: string
  │   ├── name: string
  │   ├── createdBy: string
  │   └── permissions: array
  └── isActive: boolean
```

### Dashboards Collection (Company-Scoped)

```firestore
/dashboards/{dashboardId}
  ├── title: string
  ├── description: string
  ├── company: string            // REQUIRED! "STTH", "STTN", etc.
  ├── folderId: string
  ├── lookerUrl: string          // Looker Studio embedded URL
  ├── createdBy: string          // User or Moderator UID
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── isActive: boolean
  └── permissions: map           // Role-based permissions
      ├── "role:user": ["view"]
      ├── "role:moderator": ["view"]
      ├── "role:admin": ["view", "edit", "delete"]
      ├── "uid:somchai": ["view", "edit", "delete"]
      └── "company:STTH": ["view"]
```

---

## 🔐 Access Control

### Company Field Purpose

The `company` field serves **three critical purposes:**

1. **Data Isolation**
   - Each folder/dashboard belongs to exactly one company
   - Moderators can only manage folders in their company
   - Users can only see dashboards in their company

2. **Access Filtering**
   - App loads dashboards based on role and permissions
   - Regular users: filtered by `user.company == dashboard.company`
   - Moderators: see assigned folders regardless of company (if assigned cross-company)
   - Admins: see all companies and folders (no filtering, role grants global access)

3. **Permission Inheritance**
   - Folder-level company field controls who sees subfolders
   - Dashboard-level company field controls visibility
   - Company-wide permissions apply via "company:STTH" key

### Company Field Rules

**MUST BE SET FOR:**
- ✅ Every folder
- ✅ Every dashboard
- ✅ Every user (including admins!)

**REPRESENTS:**
- For USER/MODERATOR: Their company (restricts access to that company's resources)
- For ADMIN: Their "home company" (doesn't restrict access - admin role grants global access)

**MUST NOT CHANGE:**
- 🚫 After creation (company ownership is permanent)
- 🚫 When user role changes (company is independent of role)

### ⚠️ Impact of Changing Company Field

**DON'T change a user's `company` field unless absolutely necessary!**

If you must change it, understand the consequences:

| User Type | Impact | What to Do |
|-----------|--------|-----------|
| **USER** | Loses all dashboard access in old company; gains access to new company only | ✅ Safe if intentional (moving employee) |
| **MODERATOR** | `assignedFolders` becomes **invalid** - references folders in old company | ⚠️ **Must update** assignedFolders to point to new company folders |
| **ADMIN** | Still has global access (role grants it); home company context changes | ✅ Usually safe, but changes organizational context |

**Example Problem:**
```firestore
Before:
/users/uid_somchai
├── company: "STTH"
├── role: "moderator"
└── assignedFolders: ["folder_stth_operations"]  // ← STTH folder

After changing company to STTN:
/users/uid_somchai
├── company: "STTN"  ← Changed!
├── role: "moderator"
└── assignedFolders: ["folder_stth_operations"]  // ← Still STTH! ❌ BROKEN
     App tries to load STTH folder for STTN moderator = ERROR
```

**Correct Approach if Moving User Between Companies:**
1. ✅ Update `assignedFolders` to reference new company folders
2. ✅ Update `dashboard.permissions` if user listed individually
3. ✅ Verify user can still access appropriate resources
4. ✅ Then change `company` field

---

## ✅ Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `companies` collection
- [ ] Create all company documents (STTH, STTN, STCS, etc.)
- [ ] Add `company` field to `/users` collection
- [ ] Add `company` field to `/folders` collection
- [ ] Add `company` field to `/dashboards` collection
- [ ] Create indexes for faster queries:
  - [ ] `/folders` - index on: company, createdAt
  - [ ] `/dashboards` - index on: company, folderId, createdAt
  - [ ] `/users` - index on: company, role, isActive

### Phase 2: Firestore Security Rules
- [ ] Create rules that enforce company isolation
- [ ] Implement rules for user/moderator/admin roles
- [ ] Test rules for cross-company access prevention
- [ ] Verify admin has global access
- [ ] Document security rules

### Phase 3: Pinia Store Updates
- [ ] Update auth store to include user.company
- [ ] Create company store for company list
- [ ] Update permissions store:
  - [ ] Filter folders by user.company
  - [ ] Filter dashboards by user.company
  - [ ] Allow admin cross-company access
- [ ] Add company field validation

### Phase 4: UI Component Updates
- [ ] Add company selector to admin pages
- [ ] Update folder list to show company
- [ ] Update dashboard list to show company
- [ ] Add company badge to user profiles
- [ ] Create company management UI (admin only)

### Phase 5: Testing & Validation
- [ ] Test user access isolation per company
- [ ] Test moderator folder assignment per company
- [ ] Test admin cross-company access
- [ ] Test dashboard visibility per company
- [ ] Test permission enforcement
- [ ] Test data migration from old model (if applicable)

### Phase 6: Documentation & Training
- [ ] Document company codes and structure
- [ ] Create admin training guide
- [ ] Document company setup process
- [ ] Create troubleshooting guide
- [ ] Train admins on company management

---

## 📚 Related Documents

- [Roles & Permissions Guide](roles-and-permissions.md)
- [Database Schema](database-schema.md)
- [Development Roadmap](../OPERATIONS/roadmap.md)
- [Firestore Setup Guide](firestore-setup.md) (TBD)

---

## 🎯 Next Steps

1. **Create companies collection** in Firestore
2. **Add company field** to users, folders, dashboards collections
3. **Update Pinia stores** to respect company scoping
4. **Implement Firestore security rules** for company isolation
5. **Update admin UI** for company management
6. **Train admins** on company setup and management
