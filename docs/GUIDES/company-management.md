# Company Management Guide

> **Document Status:** Foundational Guide for Multi-Company Architecture
> **Last Updated:** 2026-03-15
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
> Only **users** have a `company` field. **Folders and dashboards DO NOT** have a company field to avoid breaking references when employees move between companies. Access control is determined by **role**, **assignments**, and **permissions**.

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

บริษัทในเครือแบ่งตามกลุ่มภูมิภาค (region groups):

```
Streamwash Group
│
├── [ไม่มีภูมิภาค] — สำนักงานใหญ่และบริษัทหลัก
│   ├── STTH — บริษัท สทรีมวอช (ประเทศไทย) จำกัด (สำนักงานใหญ่)
│   ├── STTN — บริษัท สทรีมวอช เทคโนโลยี จำกัด
│   └── STCS — บริษัท สทรีมวอช คลีนนิ่ง โซลูชั่น จำกัด
│
├── กลุ่มภาคเหนือ (NORTH)
│   ├── STCM — บริษัท สทรีมวอช (เชียงใหม่) จำกัด [Hub]
│   └── STPL — บริษัท สทรีมวอช (พิษณุโลก) จำกัด [Sub]
│
├── กลุ่มภาคตะวันออกเฉียงเหนือ (NORTHEAST)
│   ├── STNR — บริษัท สทรีมวอช (นครราชสีมา) จำกัด [Hub]
│   ├── STKK — บริษัท สทรีมวอช (ขอนแก่น) จำกัด [Sub]
│   ├── STUB — บริษัท สทรีมวอช (อุบลราชธานี) จำกัด [Sub]
│   └── STUD — บริษัท สทรีมวอช (อุดรธานี) จำกัด [Sub]
│
├── กลุ่มภาคตะวันออก (EAST)
│   ├── STPT — บริษัท สทรีมวอช (พัทยา) จำกัด [Hub]
│   ├── STCN — บริษัท สทรีมวอช (ชลบุรี) จำกัด [Sub]
│   └── STRY — บริษัท สทรีมวอช (ระยอง) จำกัด [Sub]
│
├── กลุ่มภาคใต้ (SOUTH)
│   ├── STPK — บริษัท สทรีมวอช (ภูเก็ต) จำกัด [Hub]
│   ├── STHY — บริษัท สทรีมวอช (หาดใหญ่) จำกัด [Sub]
│   └── STKB — บริษัท สทรีมวอช (กระบี่) จำกัด [Sub]
│
├── กรุงเทพและปริมณฑล (MBR)
│   ├── STSS — บริษัท สทรีมวอช เซลส์ แอนด์ เซอร์วิส จำกัด [Hub]
│   ├── STEB — บริษัท สทรีมวอช (กรุงเทพตะวันออก) จำกัด [Hub]
│   └── STSB — บริษัท สทรีมวอช (กรุงเทพใต้) จำกัด [Hub]
│
├── กลุ่มบริษัทอินโนเทค ฟู้ด แอนด์ อีควิปเม้นท์ (INNOTECH)
│   └── INFE — บริษัท อินโนเทค ฟู้ด แอนด์ อีควิปเม้นท์ จำกัด [Hub]
│
└── กลุ่มบริษัทออเร้นจ์เอส (ORANGES)
    └── ORAY — บริษัท ออเร้นจ์ เอส (พระนครศรีอยุธยา) จำกัด [Hub]
```

**Total:**
- **20 บริษัทในเครือ** (active ทั้งหมด)
- **7 กลุ่มภูมิภาค** (4 ภูมิภาคหลัก + 3 กลุ่มพิเศษ)
- **100+ dashboards** total
- **30+ folders** total

---

## 📍 Company Codes

| Code | ชื่อบริษัท | กลุ่มภูมิภาค | Role | สถานะ |
|------|-----------|--------------|------|-------|
| STTH | บริษัท สทรีมวอช (ประเทศไทย) จำกัด | — | — | Active |
| STTN | บริษัท สทรีมวอช เทคโนโลยี จำกัด | — | — | Active |
| STCS | บริษัท สทรีมวอช คลีนนิ่ง โซลูชั่น จำกัด | — | — | Active |
| STCM | บริษัท สทรีมวอช (เชียงใหม่) จำกัด | NORTH | Hub | Active |
| STPL | บริษัท สทรีมวอช (พิษณุโลก) จำกัด | NORTH | Sub | Active |
| STNR | บริษัท สทรีมวอช (นครราชสีมา) จำกัด | NORTHEAST | Hub | Active |
| STKK | บริษัท สทรีมวอช (ขอนแก่น) จำกัด | NORTHEAST | Sub | Active |
| STUB | บริษัท สทรีมวอช (อุบลราชธานี) จำกัด | NORTHEAST | Sub | Active |
| STUD | บริษัท สทรีมวอช (อุดรธานี) จำกัด | NORTHEAST | Sub | Active |
| STPT | บริษัท สทรีมวอช (พัทยา) จำกัด | EAST | Hub | Active |
| STCN | บริษัท สทรีมวอช (ชลบุรี) จำกัด | EAST | Sub | Active |
| STRY | บริษัท สทรีมวอช (ระยอง) จำกัด | EAST | Sub | Active |
| STPK | บริษัท สทรีมวอช (ภูเก็ต) จำกัด | SOUTH | Hub | Active |
| STHY | บริษัท สทรีมวอช (หาดใหญ่) จำกัด | SOUTH | Sub | Active |
| STKB | บริษัท สทรีมวอช (กระบี่) จำกัด | SOUTH | Sub | Active |
| STSS | บริษัท สทรีมวอช เซลส์ แอนด์ เซอร์วิส จำกัด | MBR | Hub | Active |
| STEB | บริษัท สทรีมวอช (กรุงเทพตะวันออก) จำกัด | MBR | Hub | Active |
| STSB | บริษัท สทรีมวอช (กรุงเทพใต้) จำกัด | MBR | Hub | Active |
| INFE | บริษัท อินโนเทค ฟู้ด แอนด์ อีควิปเม้นท์ จำกัด | INNOTECH | Hub | Active |
| ORAY | บริษัท ออเร้นจ์ เอส (พระนครศรีอยุธยา) จำกัด | ORANGES | Hub | Active |

---

## 👨‍💼 Admin Responsibilities

Admins are responsible for **company-level management**:

### 1. **Create & Configure Companies**
- Create new subsidiary company in Firestore
- Set company code (STTH, STTN, etc.)
- Define company metadata (name, description, region, regionRole)
- Set up initial folders for the company

### 2. **Manage Folders**
- Create folders (access controlled via `assignedModerators`, not company field)
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
  ├── STTH
  │   ├── name: "บริษัท สทรีมวอช (ประเทศไทย) จำกัด"
  │   ├── code: "STTH"
  │   ├── description: "สำนักงานใหญ่ประเทศไทย"
  │   ├── region: null             // ไม่มีภูมิภาค (สำนักงานใหญ่)
  │   ├── regionRole: null
  │   ├── createdAt: 2026-01-15
  │   └── isActive: true
  │
  ├── STCM
  │   ├── name: "บริษัท สทรีมวอช (เชียงใหม่) จำกัด"
  │   ├── code: "STCM"
  │   ├── description: "สาขาภาคเหนือ"
  │   ├── region: "NORTH"          // อ้างอิง regions collection
  │   ├── regionRole: "hub"        // "hub" | "sub"
  │   ├── createdAt: 2026-01-15
  │   └── isActive: true
  │
  └── ... (other companies)
```

### Step 2: Create Initial Folders

**Collection:** `/folders`

For each company, create main folders:

```firestore
/folders
  ├── folder_operations
  │   ├── name: "Operations"
  │   ├── description: "Operations dashboards"
  │   ├── createdBy: "admin_uid"
  │   ├── createdAt: 2024-01-21
  │   └── subfolders: [...]
  │
  ├── folder_finance
  │   ├── name: "Finance"
  │   └── ...
  │
  └── folder_reports
      ├── name: "Reports"
      └── ...
```

**Note:** No `company` field! Access is controlled via `assignedModerators`. This way, folders can be reused across companies if needed.

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
  ├── code: string              // Company code (STTH, STCM, etc.) — unique, immutable
  ├── name: string              // Company full name
  ├── description: string       // Optional description
  ├── region: string | null     // Region code reference (e.g., "NORTH") — null = สำนักงานใหญ่
  ├── regionRole: "hub" | "sub" | null  // Role within region — null if no region
  ├── isActive: boolean         // Active/Inactive status
  ├── createdAt: timestamp      // When company was added to system
  └── updatedAt: timestamp      // Last updated
```

### Regions Collection

```firestore
/regions/{regionCode}
  ├── code: string              // Region code (NORTH, NORTHEAST, EAST, SOUTH, MBR, ...)
  ├── name: string              // Display name (กลุ่มภาคเหนือ, กรุงเทพและปริมณฑล, ...)
  ├── description: string       // Optional description
  ├── isActive: boolean
  ├── createdAt: timestamp
  └── updatedAt: timestamp
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

### Folders Collection

```firestore
/folders/{folderId}
  ├── name: string
  ├── description: string
  ├── createdBy: string          // Admin UID
  ├── createdAt: timestamp
  ├── assignedModerators: array  // Who can manage this folder
  │   ├── userId: string
  │   ├── name: string
  │   └── permissions: array
  ├── subfolders: array
  │   ├── id: string
  │   ├── name: string
  │   ├── createdBy: string
  │   └── permissions: array
  └── isActive: boolean
```

**Note:** No `company` field! Folders are accessible regardless of user's company assignment. Access control via `assignedModerators` + user's permissions.

### Dashboards Collection

```firestore
/dashboards/{dashboardId}
  ├── title: string
  ├── description: string
  ├── folderId: string
  ├── lookerUrl: string          // Looker Studio embedded URL
  ├── createdBy: string          // User or Moderator UID
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── isActive: boolean
  └── permissions: map           // Who can view/edit this dashboard
      ├── "role:user": ["view"]
      ├── "role:moderator": ["view"]
      ├── "role:admin": ["view", "edit", "delete"]
      ├── "uid:somchai": ["view", "edit"]
      └── "company:STTH": ["view"]
```

**Note:** No `company` field! Dashboard permissions are explicit. Access control via `permissions` map + user's role.

---

## 🔐 Access Control

**For complete access control logic and permission structure details, see [Roles & Permissions Guide](./roles-and-permissions.md) - the single source of truth for all role and permission definitions.**

### How Access Works (Without Company Fields on Folders/Dashboards)

**User wants to view/edit a dashboard:**

1. **Load Dashboard**
   - App loads `/dashboards/{dashboardId}` (no company filter needed)
   - Check dashboard.permissions map

2. **Check Permissions**
   - Is user role in permissions? (e.g., "role:moderator")
   - Is user UID in permissions? (e.g., "uid:somchai")
   - Is user's company in permissions? (e.g., "company:STTH")
   - ✅ If any match → allow access
   - ❌ If none match → deny access

3. **For Moderators Managing Folders**
   - Check if folder ID is in `user.assignedFolders`
   - ✅ If yes → can create/edit dashboards in this folder
   - ❌ If no → cannot manage

**Benefits:**
- ✅ Folders/Dashboards **NOT tied to company**
- ✅ Employee changes company? No impact on folder/dashboard structure!
- ✅ Can share folders across companies if designed that way
- ✅ Explicit permissions = clear control

### Why NO Company Field on Folders/Dashboards?

| Scenario | With company field ❌ | Without company field ✅ |
|----------|----------------------|------------------------|
| Employee moves STTH → STTN | assignedFolders break | No change needed |
| Share folder across companies | Very complex | Simple via permissions |
| Clarity of access control | Implicit (company == access) | Explicit (permissions map) |
| Data isolation | Company field | Permissions enforce it |

### Company Field Rules

**MUST BE SET FOR:**
- ✅ Every user (their home company)

**MUST NOT BE SET FOR:**
- ❌ Folders (use assignedModerators instead)
- ❌ Dashboards (use permissions map instead)

**REPRESENTS (for users only):**
- For USER/MODERATOR: Their company (for filtering lists, context)
- For ADMIN: Their "home company" (doesn't restrict access - role grants global access)

---

## ✅ Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `companies` collection
- [ ] Create all company documents (STTH, STTN, STCS, etc.)
- [ ] Add `company` field to `/users` collection
- [ ] Create `/folders` collection (NO company field)
- [ ] Create `/dashboards` collection (NO company field)
- [ ] Create indexes for faster queries:
  - [ ] `/folders` - index on: assignedModerators, createdAt
  - [ ] `/dashboards` - index on: folderId, createdAt
  - [ ] `/users` - index on: company, role, isActive

### Phase 2: Firestore Security Rules
- [ ] Create rules that check `user.permissions` instead of company field
- [ ] Implement rules for user/moderator/admin roles
- [ ] Test permission-based access control
- [ ] Verify admin has global access
- [ ] Document security rules

### Phase 3: Pinia Store Updates
- [ ] Update auth store to include user.company
- [ ] Create company store for company list
- [ ] Update permissions store:
  - [ ] Check user.assignedFolders for folder management access
  - [ ] Check dashboard.permissions for dashboard access
  - [ ] Allow admin global access regardless of company
- [ ] Add permission checking logic

### Phase 4: UI Component Updates
- [ ] Add company selector to admin pages
- [ ] Update folder list (no company field, but show who can manage)
- [ ] Update dashboard list (use permissions map for visibility)
- [ ] Add company badge to user profiles
- [ ] Create company management UI (admin only)

### Phase 5: Testing & Validation
- [ ] Test user access based on dashboard permissions
- [ ] Test moderator can manage assigned folders across any company
- [ ] Test admin cross-company access to all folders/dashboards
- [ ] Test dashboard visibility via permissions map
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
