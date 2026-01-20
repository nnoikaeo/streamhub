# Firestore Setup Guide

> **Document Status:** Implementation Guide for Multi-Company Architecture  
> **Last Updated:** 2024-01  
> **Document Owner:** Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Collections to Create](#collections-to-create)
3. [Field Specifications](#field-specifications)
4. [Security Rules](#security-rules)
5. [Indexes](#indexes)
6. [Initial Data Setup](#initial-data-setup)
7. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Overview

This guide provides step-by-step instructions to set up Firestore collections for the **multi-company StreamHub dashboard management system**.

**Key Architecture:**
- **Companies:** 10+ subsidiary companies (STTH, STTN, STCS, etc.)
- **Data Isolation:** Each company's data is completely isolated
- **Access Control:** Company field determines who can access what
- **Roles:** User, Moderator (company-scoped), Admin (global)

---

## 🗂️ Collections to Create

### 1. `/companies` - Company Registry

**Purpose:** List all subsidiary companies in the system

```firestore
/companies/{companyCode}
  ├── name: string
  ├── code: string
  ├── country: string
  ├── location: string
  ├── createdAt: timestamp
  ├── isActive: boolean
  └── metadata: map
```

**Example Documents:**
```firestore
/companies/stth
  ├── name: "Streamwash Thailand"
  ├── code: "STTH"
  ├── country: "Thailand"
  ├── location: "Bangkok"
  ├── createdAt: 2024-01-21
  ├── isActive: true
  └── metadata: {
      "parentCompany": "Streamwash Group",
      "departments": ["Operations", "Finance", "Sales", "HR"],
      "contact": "admin@stth.com"
    }

/companies/sttn
  ├── name: "Streamwash Laos"
  ├── code: "STTN"
  ├── country: "Laos"
  ├── location: "Vientiane"
  ├── createdAt: 2024-01-21
  ├── isActive: true
  └── ...

... (STCS, STNR, STPT, STPK, and more)
```

### 2. `/users` - User Accounts (Company-Scoped)

**Purpose:** Store user account information with company assignment

```firestore
/users/{userId}
  ├── email: string (unique)
  ├── displayName: string
  ├── photoURL: string
  ├── role: string ("user" | "moderator" | "admin")
  ├── company: string | null (STTH, STTN, etc., or null for admins)
  ├── assignedFolders: array (moderator only)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── isActive: boolean
  └── lastLogin: timestamp
```

**Field Details:**
- `email`: User's email address (should be unique)
- `displayName`: Display name in the system
- `photoURL`: Firebase Auth provides this
- `role`: One of "user", "moderator", or "admin"
- `company`: 
  - For Users: company code (e.g., "STTH")
  - For Moderators: company code (e.g., "STTN")
  - For Admins: `null` (indicating global access)
- `assignedFolders`: Array of folder IDs (only for moderators)

### 3. `/folders` - Dashboard Folders (Company-Scoped)

**Purpose:** Organize dashboards into company-scoped folders

```firestore
/folders/{folderId}
  ├── name: string
  ├── company: string (REQUIRED!)
  ├── description: string
  ├── createdBy: string (userId)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── assignedModerators: array
  │   ├── userId: string
  │   ├── name: string
  │   └── permissions: array
  ├── subfolders: array
  │   ├── id: string
  │   ├── name: string
  │   ├── createdBy: string
  │   ├── createdAt: timestamp
  │   └── permissions: array
  ├── isActive: boolean
  └── color: string (optional, for UI)
```

**Critical:** The `company` field MUST be set for every folder!

### 4. `/dashboards` - Dashboard Documents (Company-Scoped)

**Purpose:** Store dashboard metadata and configurations

```firestore
/dashboards/{dashboardId}
  ├── title: string
  ├── description: string
  ├── company: string (REQUIRED!)
  ├── folderId: string
  ├── lookerUrl: string
  ├── icon: string
  ├── createdBy: string (userId)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── isActive: boolean
  ├── views: number (optional, tracking)
  └── permissions: map
      ├── "role:user": ["view"]
      ├── "role:moderator": ["view"]
      ├── "role:admin": ["view", "edit", "delete"]
      ├── "company:STTH": ["view"]
      └── "uid:somchai": ["view", "edit"]
```

**Critical:** The `company` field MUST be set for every dashboard!

### 5. `/invitations` - User Invitations (Company-Scoped)

**Purpose:** Track pending user invitations to companies

```firestore
/invitations/{invitationId}
  ├── email: string
  ├── sentBy: string (admin userId)
  ├── role: string ("user" | "moderator" | "admin")
  ├── company: string (which company to invite to)
  ├── status: string ("pending" | "accepted" | "rejected")
  ├── sentAt: timestamp
  ├── expiresAt: timestamp
  ├── invitationCode: string (for email link)
  └── customMessage: string (optional)
```

---

## 📝 Field Specifications

### Company Field (Critical)

**Rule:** Every document that represents company-scoped data MUST have a `company` field.

**For what objects:**
- ✅ `/users/{userId}` where role != "admin"
- ✅ `/folders/{folderId}`
- ✅ `/dashboards/{dashboardId}`
- ✅ `/invitations/{invitationId}`

**Values:**
- User/Moderator: `"STTH"`, `"STTN"`, `"STCS"`, etc.
- Admin: `null` (to indicate global access)

**Purpose:** Used for filtering and access control

### Role Field

**Valid Values:**
```
"user"       → Can only view assigned dashboards
"moderator"  → Can create/manage dashboards in assigned folders
"admin"      → Has global access to all companies and data
```

### Permissions Field Structure

The `permissions` map uses dot-notation keys:

```
"role:user"              → All regular users
"role:moderator"         → All moderators
"role:admin"             → All admins
"company:STTH"           → All users in company STTH
"uid:somchai"            → Specific user by UID
"folder:folder_stth_ops" → Specific folder (used in subfolders)
```

---

## 🔐 Security Rules

Create these Firestore security rules to enforce company isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: check if user is admin
    function isAdmin() {
      return request.auth.uid != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function: get user's company
    function getUserCompany() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company;
    }
    
    // Helper function: check if user's company matches document company
    function isInCompany(docCompany) {
      return getUserCompany() == docCompany || isAdmin();
    }
    
    // Allow access to own user document
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Company-scoped access: Users
    match /folders/{folderId} {
      allow read: if isAdmin() || isInCompany(resource.data.company);
      allow write: if isAdmin();
    }
    
    // Company-scoped access: Dashboards
    match /dashboards/{dashboardId} {
      allow read: if isAdmin() || isInCompany(resource.data.company);
      allow write: if isAdmin() || (
        request.auth.uid != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'moderator' &&
        getUserCompany() == resource.data.company
      );
      allow delete: if isAdmin();
    }
    
    // Company-scoped access: Invitations
    match /invitations/{invitationId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Global access: Companies list
    match /companies/{companyCode} {
      allow read: if request.auth.uid != null;
      allow write: if isAdmin();
    }
  }
}
```

---

## 📊 Indexes

Create these composite indexes for better query performance:

### Folders Index
- Collection: `/folders`
- Fields to index:
  - `company` (Ascending)
  - `createdAt` (Descending)

### Dashboards Index
- Collection: `/dashboards`
- Fields to index:
  - `company` (Ascending)
  - `folderId` (Ascending)
  - `createdAt` (Descending)

### Users Index
- Collection: `/users`
- Fields to index:
  - `company` (Ascending)
  - `role` (Ascending)
  - `isActive` (Ascending)

### Invitations Index
- Collection: `/invitations`
- Fields to index:
  - `company` (Ascending)
  - `status` (Ascending)
  - `sentAt` (Descending)

**How to create indexes in Firebase Console:**
1. Go to Firestore Database
2. Click "Indexes" tab
3. Click "Create Index"
4. Select fields and sort order
5. Click "Create Index"
6. Wait for index to build

---

## 🎯 Initial Data Setup

### Step 1: Create Companies Collection

Create all subsidiary company documents:

```firestore
/companies/stth
  name: "Streamwash Thailand"
  code: "STTH"
  country: "Thailand"
  location: "Bangkok"
  createdAt: <timestamp>
  isActive: true
  metadata: {
    parentCompany: "Streamwash Group",
    departments: ["Operations", "Finance", "Sales", "HR"]
  }

/companies/sttn
  name: "Streamwash Laos"
  code: "STTN"
  country: "Laos"
  location: "Vientiane"
  ...

(repeat for STCS, STNR, STPT, STPK, etc.)
```

### Step 2: Create Initial Admin User

```firestore
/users/admin_uid_123
  email: "admin@streamwash.com"
  displayName: "Admin"
  photoURL: ""
  role: "admin"
  company: null  // Admin has global access
  assignedFolders: []
  createdAt: <timestamp>
  isActive: true
  lastLogin: null
```

### Step 3: Create Initial Folders

For each company, create main folders:

```firestore
/folders/folder_stth_operations
  name: "Operations"
  company: "STTH"  // REQUIRED!
  description: "Operations dashboards for STTH"
  createdBy: "admin_uid_123"
  createdAt: <timestamp>
  updatedAt: <timestamp>
  assignedModerators: []
  subfolders: []
  isActive: true
  color: "#3B82F6"

/folders/folder_stth_finance
  name: "Finance"
  company: "STTH"
  ...

(repeat for other companies)
```

---

## ✅ Implementation Checklist

- [ ] **Create `/companies` collection**
  - [ ] Add all subsidiary company documents
  - [ ] Verify all company codes present

- [ ] **Create `/users` collection**
  - [ ] Add admin user with role="admin", company=null
  - [ ] Test: Can read own user document

- [ ] **Create `/folders` collection**
  - [ ] Add initial folders for each company
  - [ ] Verify `company` field is set on all folders
  - [ ] Create subfolders structure

- [ ] **Create `/dashboards` collection**
  - [ ] Create test dashboard documents
  - [ ] Verify `company` field is set on all dashboards
  - [ ] Set up permissions map

- [ ] **Create `/invitations` collection**
  - [ ] Structure ready for future invitations
  - [ ] Test: Can create invitation documents

- [ ] **Deploy Firestore Security Rules**
  - [ ] Copy security rules to Firebase Console
  - [ ] Test: Admin can access all companies
  - [ ] Test: User can access only their company
  - [ ] Test: Moderator can't access other companies

- [ ] **Create Indexes**
  - [ ] Folders index (company, createdAt)
  - [ ] Dashboards index (company, folderId, createdAt)
  - [ ] Users index (company, role, isActive)
  - [ ] Invitations index (company, status, sentAt)

- [ ] **Verify Data Isolation**
  - [ ] Test query: Get all STTH dashboards
  - [ ] Test query: Get all STTN folders
  - [ ] Test query: Admin sees all companies
  - [ ] Test query: STTH user can't see STTN data

---

## 📚 Related Documents

- [Company Management Guide](company-management.md)
- [Roles & Permissions Guide](roles-and-permissions.md)
- [Development Roadmap](../OPERATIONS/roadmap.md)
- [Firebase Configuration](firebase-config.md) (TBD)

---

## 🚀 Next Steps

1. Create all collections in Firestore Console
2. Add initial company documents
3. Create admin user
4. Deploy security rules
5. Create composite indexes
6. Test data isolation with queries
7. Update Pinia stores to respect company field
