# Database Schema Reference

> **Document Status:** Technical Reference for Firestore Data Model  
> **Last Updated:** 2024-01  
> **Document Owner:** Development Team  
> **Version:** 2.0 (Multi-Company Architecture)

---

## Collections Overview (Company-Scoped)

```
Firestore Database (Multi-Company)
├── companies/           (🏢 Subsidiary companies registry)
├── users/              (👥 User accounts - company-scoped)
├── folders/            (📁 Dashboard folders - company-scoped)
├── dashboards/         (📊 Dashboard documents - company-scoped)
└── invitations/        (📧 User invitations - company-scoped)
```

---

## 1. Companies Collection

**Path:** `/companies/{companyCode}`  
**Purpose:** Registry of subsidiary companies

**Document Structure:**

```typescript
{
  name: string                   // Company name
  code: string                   // Unique company code (STTH, STTN, etc.)
  country: string                // Country location
  location: string               // City/area
  createdAt: Timestamp           // Creation date
  isActive: boolean              // Active/inactive status
  metadata: {
    parentCompany: string
    departments: string[]
    contact: string
    website: string
  }
}
```

**Example:**
```json
{
  "name": "Streamwash Thailand",
  "code": "STTH",
  "country": "Thailand",
  "location": "Bangkok",
  "createdAt": Timestamp(2024-01-20),
  "isActive": true,
  "metadata": {
    "parentCompany": "Streamwash Group",
    "departments": ["Operations", "Finance", "Sales", "HR"],
    "contact": "contact@stth.com"
  }
}
```

---

## 2. Users Collection

**Path:** `/users/{userId}`  
**Purpose:** User accounts with company assignment

**Document Structure:**

```typescript
{
  email: string                  // Email address (unique)
  displayName: string            // Display name
  photoURL: string               // Profile photo URL
  role: 'user'|'moderator'|'admin'  // Role
  company: string | null         // Company code or null for admins
  assignedFolders: string[]      // Folder IDs (moderators only)
  createdAt: Timestamp           // Account creation date
  updatedAt: Timestamp           // Last update date
  isActive: boolean              // Active/inactive status
  lastLogin: Timestamp           // Last login time
  metadata: {
    phone: string
    position: string
    department: string
  }
}
```

**Example Regular User:**
```json
{
  "email": "somchai@stth.com",
  "displayName": "สมชาย",
  "photoURL": "https://...",
  "role": "user",
  "company": "STTH",
  "assignedFolders": [],
  "createdAt": Timestamp(2024-01-20),
  "isActive": true,
  "metadata": {
    "phone": "+66-XXX-XXXX",
    "position": "Staff",
    "department": "Operations"
  }
}
```

**Example Moderator:**
```json
{
  "email": "moderator@stth.com",
  "displayName": "สมชาย",
  "role": "moderator",
  "company": "STTH",
  "assignedFolders": ["folder_stth_operations", "folder_stth_reports"],
  "createdAt": Timestamp(2024-01-20),
  "isActive": true
}
```

**Example Admin:**
```json
{
  "email": "admin@streamwash.com",
  "displayName": "Admin Thailand",
  "role": "admin",
  "company": "STTH",
  "assignedFolders": [],
  "createdAt": Timestamp(2024-01-20),
  "isActive": true
}
```

**Important:** Admins MUST have a `company` field (representing their home company). Their `admin` role grants them access to all companies and folders, but they still need a company assignment for organizational purposes.

**Firestore Rules:**
```firestore
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow write: if request.auth.uid == userId || isAdmin();
}
```

---

## 3. Folders Collection

**Path:** `/folders/{folderId}`  
**Purpose:** Dashboard organization (company-scoped)

**Document Structure:**

```typescript
{
  name: string                   // Folder name
  company: string                // Company code (REQUIRED!)
  description: string            // Description
  createdBy: string              // Admin user ID
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update
  assignedModerators: [{
    userId: string
    name: string
    permissions: string[]
  }]
  subfolders: [{
    id: string
    name: string
    createdBy: string
    permissions: string[]
  }]
  isActive: boolean              // Active/inactive
  color: string                  // Hex color for UI
  displayOrder: number           // Sort order
}
```

**Example:**
```json
{
  "name": "Operations",
  "company": "STTH",
  "description": "Operations dashboards for STTH",
  "createdBy": "admin_uid",
  "createdAt": Timestamp(2024-01-20),
  "assignedModerators": [
    {
      "userId": "uid_somchai",
      "name": "สมชาย",
      "permissions": ["view", "create", "edit", "delete"]
    }
  ],
  "subfolders": [
    {
      "id": "subfolder_stth_ops_daily",
      "name": "Daily Reports",
      "createdBy": "uid_somchai",
      "permissions": ["view", "edit"]
    }
  ],
  "isActive": true,
  "color": "#3B82F6",
  "displayOrder": 1
}
```

**Critical:** `company` field MUST be set!

---

## 4. Dashboards Collection

**Path:** `/dashboards/{dashboardId}`  
**Purpose:** Dashboard metadata and configuration

**Document Structure:**

```typescript
{
  title: string                  // Dashboard title
  description: string            // Description
  company: string                // Company code (REQUIRED!)
  folderId: string               // Parent folder ID
  lookerUrl: string              // Looker Studio embed URL
  icon: string                   // Material icon name
  createdBy: string              // Creator user ID
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update
  isActive: boolean              // Active/inactive
  views: number                  // View count
  permissions: {
    [key: string]: string[]      // Role/user-based permissions
  }
}
```

**Example:**
```json
{
  "title": "STTH Daily Operations Report",
  "description": "Daily performance metrics",
  "company": "STTH",
  "folderId": "folder_stth_operations",
  "lookerUrl": "https://lookerstudio.google.com/embed/reporting/...",
  "icon": "bar_chart",
  "createdBy": "uid_somchai",
  "createdAt": Timestamp(2024-01-20),
  "isActive": true,
  "views": 143,
  "permissions": {
    "role:user": ["view"],
    "role:moderator": ["view"],
    "role:admin": ["view", "edit", "delete"],
    "company:STTH": ["view"],
    "uid:somchai": ["view", "edit"]
  }
}
```

**Critical:** `company` field MUST be set!

**Firestore Rules:**
```firestore
match /dashboards/{dashboardId} {
  allow read: if isAdmin() || isInCompany(resource.data.company);
  allow write: if isAdmin() || isModerator(resource.data.company);
  allow delete: if isAdmin();
}
```

---

## 5. Invitations Collection

**Path:** `/invitations/{invitationId}`  
**Purpose:** Track pending user invitations

**Document Structure:**

```typescript
{
  email: string                  // Invited email
  sentBy: string                 // Admin user ID
  role: string                   // Assigned role
  company: string                // Company to invite to
  status: 'pending'|'accepted'|'rejected'  // Invitation status
  sentAt: Timestamp              // When sent
  expiresAt: Timestamp           // When expires
  invitationCode: string         // Unique code (unique)
  customMessage: string          // Custom message
  acceptedAt: Timestamp          // When accepted
  acceptedBy: string             // User ID who accepted
  metadata: {
    browserInfo: string
    ipAddress: string
  }
}
```

**Example:**
```json
{
  "email": "newuser@stth.com",
  "sentBy": "admin_uid",
  "role": "moderator",
  "company": "STTH",
  "status": "pending",
  "sentAt": Timestamp(2024-01-21),
  "expiresAt": Timestamp(2024-02-07),
  "invitationCode": "abc123xyz",
  "customMessage": "Welcome to Operations team!",
  "acceptedAt": null,
  "acceptedBy": null,
  "metadata": {
    "browserInfo": "Chrome 120",
    "ipAddress": "192.168.1.1"
  }
}
```

---

## Composite Indexes

**Folders Index:**
- Collection: `folders`
- Fields: `company` (Asc), `createdAt` (Desc)

**Dashboards Index:**
- Collection: `dashboards`
- Fields: `company` (Asc), `folderId` (Asc), `createdAt` (Desc)

**Users Index:**
- Collection: `users`
- Fields: `company` (Asc), `role` (Asc), `isActive` (Asc)

**Invitations Index:**
- Collection: `invitations`
- Fields: `company` (Asc), `status` (Asc), `sentAt` (Desc)

---

## Data Relationships

```
Company (1)
  ├─ has (many) Users
  │   ├─ role: user/moderator/admin
  │   └─ assignedFolders (if moderator)
  │
  ├─ has (many) Folders
  │   ├─ contains Subfolders
  │   └─ assigned to Moderators
  │
  ├─ has (many) Dashboards
  │   ├─ in Folder
  │   └─ has Permissions
  │
  └─ has (many) Invitations
      └─ pending/accepted/rejected
```

---

## Querying Examples

### Get all users in a company
```typescript
const users = await db.collection('users')
  .where('company', '==', 'STTH')
  .where('isActive', '==', true)
  .get()
```

### Get all dashboards for a folder
```typescript
const dashboards = await db.collection('dashboards')
  .where('folderId', '==', 'folder_id')
  .orderBy('createdAt', 'desc')
  .get()
```

### Get all folders for a company
```typescript
const folders = await db.collection('folders')
  .where('company', '==', 'STTH')
  .where('isActive', '==', true)
  .get()
```

### Get moderators in company
```typescript
const mods = await db.collection('users')
  .where('company', '==', 'STTH')
  .where('role', '==', 'moderator')
  .get()
```

---

## Naming Conventions

- **Collection names:** `lowercase` (e.g., `users`, `dashboards`)
- **Document IDs:** `snake_case` (e.g., `folder_stth_operations`)
- **Field names:** `camelCase` (e.g., `displayName`)
- **Company codes:** `UPPERCASE` (e.g., `STTH`, `STTN`)

---

## Best Practices

✅ **DO:**
- Always set `company` field on company-scoped docs
- Filter by company in all queries
- Use composite indexes for complex queries
- Validate company ownership before updates
- Use soft deletes (mark `isActive: false`)

❌ **DON'T:**
- Query without company filter
- Store unencrypted sensitive data
- Update `company` field after creation
- Store large files directly in DB
- Trust client-side validation alone

---

## See Also

- [Firestore Setup Guide](firestore-setup.md)
- [Company Management Guide](company-management.md)
- [Roles & Permissions Guide](roles-and-permissions.md)
