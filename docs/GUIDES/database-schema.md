# Database Schema Reference

> **Document Status:** Technical Reference for Firestore Data Model
> **Last Updated:** 2026-03-22
> **Document Owner:** Development Team
> **Version:** 5.0 (Sync with actual TypeScript interfaces)

---

## Collections Overview (Company-Scoped)

```
Firestore Database (Multi-Company)
├── companies/           (🏢 Subsidiary companies registry)
├── regions/             (🌏 Region groups for company grouping)
├── groups/              (👫 User groups / teams)
├── users/              (👥 User accounts - company-scoped)
├── folders/            (📁 Dashboard folders - no company field)
├── dashboards/         (📊 Dashboard documents - no company field)
├── invitations/        (📧 User invitations - company-scoped)
└── tags/               (🏷️ Dashboard tags - cross-company)
```

---

## 1. Companies Collection

**Path:** `/companies/{companyCode}`  
**Purpose:** Registry of subsidiary companies

**Document Structure:**

```typescript
{
  code: string                   // Unique company code (STTH, STCM, etc.) — immutable after creation
  name: string                   // Company full name
  description: string            // Optional description
  region: string | null          // Region code reference (e.g., "NORTH") — null = no region (HQ)
  regionRole: 'hub' | 'sub' | null  // Role within region — required when region is set
  isActive: boolean              // Active/inactive status
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update
}
```

**Example (HQ company):**
```json
{
  "code": "STTH",
  "name": "บริษัท สทรีมวอช (ประเทศไทย) จำกัด",
  "description": "สำนักงานใหญ่ประเทศไทย",
  "region": null,
  "regionRole": null,
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-03-05T10:28:27.845Z"
}
```

**Example (Regional branch):**
```json
{
  "code": "STCM",
  "name": "บริษัท สทรีมวอช (เชียงใหม่) จำกัด",
  "description": "สาขาภาคเหนือ ดูแลพื้นที่เชียงใหม่และจังหวัดใกล้เคียง",
  "region": "NORTH",
  "regionRole": "hub",
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

---

## 2. Regions Collection

**Path:** `/regions/{regionCode}`
**Purpose:** Region groups — used to group companies into geographic/business clusters

**Document Structure:**

```typescript
{
  code: string                   // Unique region code (NORTH, NORTHEAST, EAST, SOUTH, MBR, ...)
  name: string                   // Display name (กลุ่มภาคเหนือ, กรุงเทพและปริมณฑล, ...)
  description: string            // Optional description
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Example:**
```json
{
  "code": "NORTH",
  "name": "กลุ่มภาคเหนือ",
  "description": "ภาคเหนือของประเทศไทย",
  "isActive": true
}
```

**Current Regions:**
| Code | Name |
|------|------|
| NORTH | กลุ่มภาคเหนือ |
| NORTHEAST | กลุ่มภาคตะวันออกเฉียงเหนือ |
| EAST | กลุ่มภาคตะวันออก |
| SOUTH | กลุ่มภาคใต้ |
| MBR | กรุงเทพและปริมณฑล |
| INNOTECH | กลุ่มบริษัทอินโนเทค ฟู้ด แอนด์ อีควิปเม้นท์ |
| ORANGES | กลุ่มบริษัทออเร้นจ์เอส |

---

## 3. Groups Collection

**Path:** `/groups/{groupId}`  
**Purpose:** User groups / teams for bulk dashboard access assignment

**Document Structure:**

```typescript
{
  id: string                     // Group ID (e.g., 'sales', 'finance')
  name: string                   // Group display name
  description?: string           // Optional description
  members: string[]              // User UIDs in this group
  isActive: boolean              // Active/inactive
  createdAt?: Timestamp          // Creation date
  updatedAt?: Timestamp          // Last update
}
```

**Example:**
```json
{
  "id": "sales",
  "name": "ทีม Sales",
  "description": "กลุ่มผู้ใช้งานฝ่ายขาย",
  "members": ["uid_user1", "uid_user2", "uid_moderator1"],
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00.000Z"
}
```

**Current Groups:** `sales`, `finance`, `operations`, `hr`

**Relationship with Dashboards:**
```
Group (1) ──── access given to ────► (many) Dashboards
  - Dashboard.access.direct.groups[] stores group IDs
  - User belongs to multiple groups
  - Groups provide Layer 1b bulk access
```

---

## 4. Users Collection

**Path:** `/users/{userId}`  
**Purpose:** User accounts with company assignment

**Document Structure:**

```typescript
{
  uid: string                    // Firebase Auth UID (document ID)
  email: string                  // Email address (unique)
  name: string                   // Display name
  photoURL?: string              // Profile photo URL
  role: 'user' | 'moderator' | 'admin'  // Role
  company: string                // Company code (STTH, STTN, etc.) - ALL users including admins
  groups: string[]               // Group IDs the user belongs to (e.g., ['sales', 'finance'])
  assignedFolders: string[]      // Folder IDs (moderators only; empty for user/admin)
  isActive: boolean              // Active/inactive status
  createdAt: Timestamp           // Account creation date
  updatedAt: Timestamp           // Last update date
  lastLogin?: Timestamp          // Last login time
}
```

**Example Regular User:**
```json
{
  "uid": "uid_somchai",
  "email": "somchai@stth.com",
  "name": "สมชาย ใจดี",
  "photoURL": "https://...",
  "role": "user",
  "company": "STTH",
  "groups": ["ops"],
  "assignedFolders": [],
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00.000Z"
}
```

**Example Moderator:**
```json
{
  "uid": "uid_moderator1",
  "email": "moderator@stth.com",
  "name": "มนัส ผู้จัดการ",
  "role": "moderator",
  "company": "STTH",
  "groups": ["sales"],
  "assignedFolders": ["folder_sales", "folder_finance"],
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00.000Z"
}
```

**Example Admin:**
```json
{
  "uid": "uid_admin1",
  "email": "admin@streamvoice.com",
  "name": "Admin Thailand",
  "role": "admin",
  "company": "STTH",
  "groups": [],
  "assignedFolders": [],
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00.000Z"
}
```

**Important:** Admins MUST have a `company` field (representing their home company). Their `admin` role grants them access to all companies and folders via `canAccessAdmin` permission.

**Firestore Rules:**
```firestore
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow write: if request.auth.uid == userId || isAdmin();
}
```

---

## 4. Folders Collection

**Path:** `/folders/{folderId}`  
**Purpose:** Dashboard organization (not company-scoped — uses access control instead)

**Document Structure:**

```typescript
{
  id: string                     // Folder ID (document ID)
  name: string                   // Folder name
  parentId?: string | null       // Parent folder ID (null = root level)
  description?: string           // Optional description
  isActive: boolean              // Active/inactive
  createdBy: string              // Creator UID
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update
  updatedBy: string              // UID of who last updated
  assignedModerators?: string[]  // Moderator UIDs (not objects)

  // 3-Layer permission model (same as Dashboard)
  access?: {
    direct: {
      users: string[]            // UIDs with direct access
      groups: string[]           // Group IDs with access
    }
    company: string[]            // Company codes whose users get access
  }
  restrictions?: {
    revoke: string[]             // Explicitly revoked UIDs
    expiry: { [uid: string]: Timestamp }  // Time-based revocation
  }
  inheritPermissions?: boolean   // Cascade permissions to child dashboards
  permissionMeta?: {
    setBy: string
    setAt: string
  }

  // Client-side only (not stored in DB)
  // children?: Folder[]         // Populated at runtime for tree view
  // level?: number              // Depth in hierarchy (0 = root)
}
```

**Example:**
```json
{
  "id": "folder_sales",
  "name": "Sales",
  "parentId": null,
  "description": "Sales dashboards and reports",
  "createdBy": "uid_admin1",
  "createdAt": "2026-01-20T00:00:00.000Z",
  "isActive": true,
  "assignedModerators": ["uid_moderator1"],
  "access": {
    "direct": {
      "users": ["uid_somchai"],
      "groups": ["sales"]
    },
    "company": ["STTH"]
  },
  "restrictions": {
    "revoke": [],
    "expiry": {}
  },
  "inheritPermissions": false
}
```

**Note:** No `company` field — folders are not tied to a single company. Access is controlled via the `access` model.

---

## 5. Dashboards Collection

**Path:** `/dashboards/{dashboardId}`  
**Purpose:** Dashboard metadata and configuration

**⚠️ IMPORTANT:** For complete access control logic, **see [Roles & Permissions Guide > Permission Structure](./roles-and-permissions.md#permission-structure)**

**Document Structure:**

```typescript
{
  id: string                     // Dashboard ID (document ID)
  name: string                   // Dashboard name
  description?: string           // Optional description
  folderId: string               // Parent folder ID
  type: 'looker'                 // Dashboard type (only 'looker' supported)
  lookerDashboardId?: string     // Looker Studio dashboard ID
  lookerEmbedUrl?: string        // Looker Studio embed URL

  // Metadata
  owner: string                  // Creator UID
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update
  updatedBy: string              // UID of who last updated

  // Tags
  tags: string[]                 // Tag IDs (e.g., ["tag_sales", "tag_kpi"])

  // Status
  isArchived: boolean            // Archive status (replaces isActive)
  archivedAt?: Timestamp         // When archived

  // 3-Layer Permission Model ← See roles-and-permissions.md for full details
  access: {
    direct: {
      users: string[]            // Layer 1a: UIDs with direct access
      groups: string[]           // Layer 1b: Group IDs with access
    }
    company: string[]            // Layer 2: Company codes (all users in these companies)
  }
  restrictions: {                // Layer 3: Explicit deny (overrides layers 1 & 2)
    revoke: string[]             // Explicitly revoked UIDs
    expiry: { [uid: string]: Timestamp }  // Time-based revocation
  }
  permissionMeta?: {
    setBy: string                // UID of who set permissions
    setByName?: string           // Display name (denormalized)
    setAt: string                // ISO date string
  }
}
```

**Example:**
```json
{
  "id": "dash_sales_daily",
  "name": "Daily Operations Report",
  "description": "Daily performance metrics",
  "folderId": "folder_sales",
  "type": "looker",
  "lookerEmbedUrl": "https://lookerstudio.google.com/embed/reporting/...",
  "owner": "uid_moderator1",
  "createdAt": "2026-01-20T00:00:00.000Z",
  "isArchived": false,
  "tags": ["tag_sales", "tag_monthly", "tag_kpi"],
  "access": {
    "direct": {
      "users": ["uid_somchai"],
      "groups": ["sales"]
    },
    "company": ["STTH"]
  },
  "restrictions": {
    "revoke": [],
    "expiry": {}
  }
}
```

**Note:** No `company` field — access is controlled exclusively via the 3-layer `access`/`restrictions` model.

**Firestore Rules:**
```firestore
match /dashboards/{dashboardId} {
  allow read: if hasPermission(request.auth.uid, "view");
  allow write: if hasPermission(request.auth.uid, "edit");
  allow delete: if isAdmin();
}
```

---

## 6. Invitations Collection

**Path:** `/invitations/{invitationId}`  
**Purpose:** Track pending user invitations

**Document Structure:**

```typescript
{
  id: string                     // Invitation ID (document ID)
  email: string                  // Invited email
  role: 'user' | 'moderator' | 'admin'  // Assigned role
  company: string                // Company code to invite to
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'  // Status
  invitedBy: string              // Admin UID who sent the invite
  invitedByName: string          // Inviter display name (denormalized)
  message?: string               // Optional custom message
  assignedFolders?: string[]     // Folder IDs to assign on acceptance
  assignedGroups?: string[]      // Group IDs to assign on acceptance

  // Tracking
  invitationCode: string         // UUID v4 — unique one-time code
  expiresAt: Timestamp           // Expiry date
  createdAt: Timestamp           // When created
  updatedAt: Timestamp           // Last update

  // Acceptance
  acceptedAt?: Timestamp         // When accepted
  acceptedByUid?: string         // UID of the user who accepted
}
```

**Example:**
```json
{
  "id": "inv_001",
  "email": "newuser@stth.com",
  "role": "moderator",
  "company": "STTH",
  "status": "pending",
  "invitedBy": "uid_admin1",
  "invitedByName": "Admin Thailand",
  "message": "Welcome to the Operations team!",
  "assignedFolders": ["folder_sales"],
  "assignedGroups": ["sales"],
  "invitationCode": "a1b2c3d4-e5f6-...",
  "expiresAt": "2026-04-05T00:00:00.000Z",
  "createdAt": "2026-03-22T00:00:00.000Z",
  "acceptedAt": null,
  "acceptedByUid": null
}
```

**Status Lifecycle:**
```
pending → accepted   (user clicks invite link and accepts)
pending → expired    (expiresAt date passed)
pending → cancelled  (admin cancels the invitation)
```

---


## 7. Tags Collection

**Path:** `/tags/{tagId}`
**Purpose:** Dashboard categorization tags for filtering and discovery (cross-company)

**Document Structure:**

```typescript
{
  name: string                   // Tag display name (e.g., "Sales")
  slug: string                   // URL-safe identifier (e.g., "sales") - unique
  color: string                  // Hex color for UI display (e.g., "#F59E0B")
  description: string            // Brief description of tag purpose
  createdBy: string              // Admin user ID who created this tag
  createdAt: Timestamp           // Creation date
  updatedAt: Timestamp           // Last update date
  isActive: boolean              // Active/inactive status
}
```

**Example:**
```json
{
  "name": "Sales",
  "slug": "sales",
  "color": "#F59E0B",
  "description": "Sales-related dashboards and reports",
  "createdBy": "admin_uid",
  "createdAt": "Timestamp(2024-01-20)",
  "updatedAt": "Timestamp(2024-01-20)",
  "isActive": true
}
```

**Access Rules:**
- **Admin:** Full CRUD (create, read, update, delete)
- **Moderator:** Read all tags + assign/unassign tags to dashboards in `assignedFolders`
- **User:** Read only (for filtering)

**Firestore Rules:**
```firestore
match /tags/{tagId} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

**Relationship with Dashboards:**
```
Tag (1) ←──── tagged by ────→ (many) Dashboards
  - Dashboard.tags[] stores tag IDs
  - One dashboard can have multiple tags (many-to-many)
  - Tags are cross-company (shared across all companies)
```

---

## Composite Indexes

**Folders Index:**
- Collection: `folders`
- Fields: `isActive` (Asc), `createdAt` (Desc)
- *(Folders have no `company` field)*

**Dashboards Index:**
- Collection: `dashboards`
- Fields: `folderId` (Asc), `isArchived` (Asc), `createdAt` (Desc)
- *(Dashboards have no `company` field)*

**Users Index:**
- Collection: `users`
- Fields: `company` (Asc), `role` (Asc), `isActive` (Asc)

**Invitations Index:**
- Collection: `invitations`
- Fields: `company` (Asc), `status` (Asc), `createdAt` (Desc)

**Dashboards by Tag Index:**
- Collection: `dashboards`
- Fields: `tags` (Array Contains), `createdAt` (Desc)

**Tags Index:**
- Collection: `tags`
- Fields: `isActive` (Asc), `name` (Asc)

**Groups Index:**
- Collection: `groups`
- Fields: `isActive` (Asc), `name` (Asc)

---

## Data Relationships

```
Region (1)
  └─ groups (many) Companies
      └─ Company.region stores region code (code reference)

Company (1)
  ├─ belongs to (0-1) Region   // via company.region code
  ├─ has regionRole: hub|sub   // hierarchy within region
  │
  ├─ has (many) Users
  │   ├─ role: user/moderator/admin
  │   ├─ groups: string[]      // group memberships
  │   └─ assignedFolders (if moderator)
  │
  └─ has (many) Invitations
      └─ pending/accepted/expired/cancelled

Groups (cross-company)
  └─ has (many) members: string[]  // User UIDs

Folders (no company field)
  ├─ parentId → parent Folder (null = root)
  ├─ assignedModerators: string[]
  └─ contains (many) Dashboards (via folderId on Dashboard)

Dashboards (no company field)
  ├─ folderId → parent Folder
  ├─ access.direct.users[] → Users (direct access)
  ├─ access.direct.groups[] → Groups (bulk access)
  ├─ access.company[] → Company codes (all users in these companies)
  └─ tags[] → Tags (many-to-many)

Tags (cross-company, shared)
  └─ tagged by Dashboards via Dashboard.tags[]
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

### Get all dashboards in a folder
```typescript
const dashboards = await db.collection('dashboards')
  .where('folderId', '==', 'folder_sales')
  .where('isArchived', '==', false)
  .orderBy('createdAt', 'desc')
  .get()
```

### Get root folders
```typescript
// Folders have no company field; filter by parentId for root level
const folders = await db.collection('folders')
  .where('parentId', '==', null)
  .where('isActive', '==', true)
  .get()
```

### Get subfolders for a parent
```typescript
const subfolders = await db.collection('folders')
  .where('parentId', '==', 'folder_sales')
  .get()
```

### Get moderators in a company
```typescript
const mods = await db.collection('users')
  .where('company', '==', 'STTH')
  .where('role', '==', 'moderator')
  .get()
```

### Get all active tags
```typescript
const tags = await db.collection('tags')
  .where('isActive', '==', true)
  .orderBy('name')
  .get()
```

### Get dashboards by tag
```typescript
const dashboards = await db.collection('dashboards')
  .where('tags', 'array-contains', 'tag_sales')
  .where('isArchived', '==', false)
  .orderBy('createdAt', 'desc')
  .get()
```

### Get group members
```typescript
const group = await db.collection('groups').doc('sales').get()
const memberUids = group.data()?.members  // string[]
```
```

---

## Naming Conventions

- **Collection names:** `lowercase` (e.g., `users`, `dashboards`, `groups`)
- **Document IDs:** `snake_case` (e.g., `folder_sales`, `tag_kpi`)
- **Field names:** `camelCase` (e.g., `isArchived`, `invitedBy`)
- **Company codes:** `UPPERCASE` (e.g., `STTH`, `STTN`)
- **Group IDs:** `lowercase_snake` (e.g., `sales`, `finance`, `hr`)
- **Tag IDs:** `tag_` prefix (e.g., `tag_sales`, `tag_kpi`)

---

## Best Practices

✅ **DO:**
- Always set `company` field on company-scoped docs (users, invitations)
- Filter users/invitations by `company` in queries
- Use `isArchived` (not `isActive`) for Dashboard soft-delete
- Use `isActive` for Users, Folders, Tags, Companies, Groups
- Use composite indexes for complex queries
- Use 3-layer access model for Dashboard/Folder permissions (not a flat `permissions` map)

❌ **DON'T:**
- Add `company` field to `folders` or `dashboards` (they are not company-scoped)
- Use the old flat `permissions: { "role:admin": [...] }` format (replaced by `access`/`restrictions`)
- Store unencrypted sensitive data
- Update `company` field on users after creation
- Store large files directly in DB

---

## See Also

- [Company Management Guide](company-management.md)
- [Roles & Permissions Guide](roles-and-permissions.md) ⭐ Single Source of Truth for the access/restrictions model
