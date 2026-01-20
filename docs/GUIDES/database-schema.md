---
title: Database Schema
version: 1.0
updated: 2024-01-21
---

# Database Schema

Firestore collections and document structure.

## Collections Overview

```
Firestore Database
├── users/
├── dashboards/
├── documents/
└── settings/
```

---

## 1. Users Collection

**Path:** `/users/{userId}`

**Purpose:** Store user profile information

**Document Structure:**

```typescript
{
  uid: string                    // User ID from Firebase Auth
  email: string                  // User email
  displayName: string            // Full name
  photoURL: string              // Profile picture URL
  role: 'admin' | 'user'        // User role
  active: boolean               // Account active status
  createdAt: Timestamp          // Account creation date
  updatedAt: Timestamp          // Last update date
  lastLogin: Timestamp          // Last login timestamp
}
```

**Example:**
```json
{
  "uid": "user_12345",
  "email": "john@streamvoice.com",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "role": "admin",
  "active": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-21T15:30:00Z",
  "lastLogin": "2024-01-21T15:30:00Z"
}
```

**Firestore Rules:**
```firestore
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}
```

---

## 2. Dashboards Collection

**Path:** `/dashboards/{dashboardId}`

**Purpose:** Store dashboard configurations

**Document Structure:**

```typescript
{
  id: string                     // Unique dashboard ID
  ownerId: string               // User ID of owner
  name: string                  // Dashboard name
  description: string           // Dashboard description
  type: 'sales' | 'analytics'   // Dashboard type
  isPublic: boolean             // Share status
  widgets: Widget[]             // Dashboard widgets
  theme: {
    color: string
    layout: string
  }
  collaborators: string[]       // User IDs of collaborators
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Example:**
```json
{
  "id": "dash_001",
  "ownerId": "user_12345",
  "name": "Q1 Sales Dashboard",
  "description": "Sales metrics for Q1 2024",
  "type": "sales",
  "isPublic": false,
  "widgets": [
    {
      "id": "widget_1",
      "type": "chart",
      "title": "Monthly Revenue",
      "data": "monthly_revenue"
    }
  ],
  "theme": {
    "color": "blue",
    "layout": "grid"
  },
  "collaborators": ["user_67890"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-21T00:00:00Z"
}
```

**Firestore Rules:**
```firestore
match /dashboards/{dashboardId} {
  allow read: if 
    request.auth.uid == resource.data.ownerId ||
    request.auth.uid in resource.data.collaborators;
  allow write: if request.auth.uid == resource.data.ownerId;
}
```

---

## 3. Documents Collection

**Path:** `/documents/{documentId}`

**Purpose:** Store uploaded files metadata

**Document Structure:**

```typescript
{
  id: string
  ownerId: string
  name: string
  fileType: string              // .pdf, .xlsx, etc.
  size: number                  // File size in bytes
  url: string                   // Cloud Storage URL
  tags: string[]
  isPublic: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## 4. Settings Collection

**Path:** `/settings/{settingId}`

**Purpose:** Store app-level configuration

**Document Structure:**

```typescript
{
  key: string                   // Setting key (e.g., 'theme')
  value: any                    // Setting value
  type: 'string' | 'boolean'   // Value type
  updatedAt: Timestamp
  updatedBy: string            // Admin user ID
}
```

---

## Indexes (if needed)

Firestore auto-creates simple indexes. Complex queries need manual indexes:

```firestore
// Example: Query users by role and active status
collection: users
fields:
  - role (Ascending)
  - active (Ascending)
```

---

## Data Validation Schema

### Zod Schemas

```typescript
// user schema
const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(['admin', 'user']),
  active: z.boolean()
})

// dashboard schema
const dashboardSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sales', 'analytics']),
  isPublic: z.boolean()
})
```

---

## Querying Examples

### Get all users
```typescript
const usersRef = collection(db, 'users')
const snapshot = await getDocs(usersRef)
```

### Get single dashboard
```typescript
const dashRef = doc(db, 'dashboards', 'dash_001')
const snapshot = await getDoc(dashRef)
```

### Query with filter
```typescript
const q = query(
  collection(db, 'users'),
  where('role', '==', 'admin'),
  where('active', '==', true)
)
const snapshot = await getDocs(q)
```

### Real-time listener
```typescript
const unsubscribe = onSnapshot(
  collection(db, 'dashboards'),
  (snapshot) => {
    dashboards.value = snapshot.docs.map(doc => doc.data())
  }
)
```

---

## Data Relationships

```
User (1)
  ├─ owns (many) Dashboards
  │   ├─ contains Widgets
  │   └─ shared with Collaborators
  │
  ├─ owns (many) Documents
  │
  └─ has (one) Settings
```

---

## Naming Conventions

- **Collection names:** `lowercase` (e.g., `users`)
- **Document IDs:** `snake_case` (e.g., `user_12345`)
- **Field names:** `camelCase` (e.g., `displayName`)
- **Timestamps:** ISO 8601 format

---

## Best Practices

✅ **DO:**
- Use timestamps for all dates
- Validate data with Zod/TypeScript
- Index frequently queried fields
- Denormalize for performance

❌ **DON'T:**
- Store large files directly in DB
- Use timestamps as IDs
- Overly normalize data
- Trust client-side validation alone

---

## See Also

- [Firestore Reference](../../REFERENCE/firestore-collections.md)
- [Authentication](authentication.md)
- [Security Rules](../../OPERATIONS/deployment.md)
