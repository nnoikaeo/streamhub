# Mock Data Structure Documentation

> **⚠️ Historical — do not treat as current.** `app/composables/useMockData.ts`, which
> this document describes, was deleted in PR #372: its last consumer was
> `MockDashboardService`, a branch of `useServiceMode` that could never be selected
> (PR #371). Development mock data now lives in `.data/*.json`, is served by
> `/api/mock/*` and reached through `useJSONMockService`; production reads Firestore.
> Kept for the permission-model rationale, which still explains why the shapes look
> the way they do — but the file layout, line counts and sample data below are stale.
> Current sources: [database-schema.md](../GUIDES/database-schema.md),
> [roles-and-permissions.md](../GUIDES/roles-and-permissions.md), `app/types/dashboard.ts`.

> **Purpose:** Complete reference for mock data design, including TypeScript interfaces, sample data, and usage patterns  
> **Created:** 2024-02-03  
> **Status:** Historical — superseded by the JSON store (`.data/*.json`) + `/api/mock/*`  

---

## 📋 Overview

Mock data structure is designed to:
1. **Match API contract exactly** - Same shape as Firebase/Firestore
2. **Support all 3-layer permissions** - Direct, Company-Scoped, Restrictions
3. **Enable easy API switching** - Components unchanged when migrating
4. **Test real scenarios** - 8 diverse dashboard examples

---

## 🗂️ File Structure

```
app/types/dashboard.ts
├─ User & Auth types
├─ Folder & Hierarchy types
├─ Dashboard types
├─ 3-layer permission types (AccessControl, AccessRestrictions)
├─ Permission result types
├─ UI-specific types (DashboardCardData)
├─ API request/response types
├─ Helper type guards
└─ ~350 lines, fully documented

app/composables/useMockData.ts
├─ mockUsers (6 users with different roles)
├─ mockGroups (sales, finance, operations)
├─ mockFolders (17 folders, 4 levels deep)
├─ mockDashboards (8 dashboards, various permission setups)
├─ Utility functions (get by ID, build hierarchy, etc.)
├─ Permission checking logic
└─ ~600 lines with examples

app/composables/useDashboardService.ts
├─ IDashboardService interface
├─ MockDashboardService implementation
├─ useDashboardService() composable hook
├─ initializeDashboardService() for setup
└─ ~500 lines, production-ready interface
```

---

## 👥 Mock Users

### User Roles & Access Patterns

```typescript
// 6 mock users with realistic distribution
mockUsers = [
  {
    uid: 'user_it_admin',
    role: 'admin',      // Can access everythingพื
    company: 'STTH',
    groups: [],
  },
  {
    uid: 'user_somchai_mod',
    role: 'moderator',  // Can edit own dashboards
    company: 'STTH',
    groups: ['sales', 'finance'],
  },
  {
    uid: 'user_nattha_mod',
    role: 'moderator',
    company: 'STTH',
    groups: ['finance'],
  },
  {
    uid: 'user_teerak_user',
    role: 'user',      // View only
    company: 'STTH',
    groups: ['sales'],
  },
  {
    uid: 'user_janine_user',
    role: 'user',
    company: 'STTH',
    groups: ['finance', 'operations'],
  },
  {
    uid: 'user_sombat_user',
    role: 'user',
    company: 'STTH',
    groups: ['operations'],
  },
]
```

**Key points:**
- **1 Admin**: Full access, can manage permissions
- **2 Moderators**: Can create/edit/delete own dashboards, quick share
- **3 Users**: View only access based on roles/groups
- **Groups**: sales, finance, operations (realistic org structure)

---

## 📁 Mock Folder Hierarchy

### Structure (4 Levels Deep)

```
STTH Company
├─ Sales
│  ├─ Reports
│  │  ├─ East          ← 3-level deep
│  │  └─ West
│  └─ Regional
│     ├─ North
│     │  └─ Q1 2024    ← 4-level deep (tests hierarchy handling)
│     └─ South
├─ Finance
│  ├─ Budget
│  │  ├─ 2024
│  │  └─ 2025
│  └─ Payroll
├─ Operations
│  └─ Inventory
└─ HR
```

**Features:**
- Tests **deep nesting** (4 levels) - validates sidebar collapse logic
- Realistic company structure
- Ready for breadcrumb navigation
- Supports folder-scoped access control

---

## 📊 Mock Dashboards (8 Examples)

### Dashboard 1: Public Dashboard (Layer 2 - Company-Scoped)

```typescript
{
  id: 'dash_sales_east_performance',
  name: 'Regional East Performance',
  folderId: 'folder_sales_reports_east',
  type: 'looker',
  owner: 'user_it_admin',
  
  access: {
    direct: {
      users: [],
      roles: ['moderator'],  // All moderators
      groups: [],
    },
    company: {
      STTH: {
        roles: ['user', 'moderator'],  // All users & moderators in STTH
        groups: ['sales'],             // All sales members
      },
    },
  },
  restrictions: {
    revoke: [],
    expiry: {},
  },
}
```

**Accessible by:**
- ✅ All moderators (layer 1: role)
- ✅ All users in STTH (layer 2: role)
- ✅ All sales members in STTH (layer 2: group)
- **Total: ~12+ users**

---

### Dashboard 2: Owner-Edited + Quick Share (Layer 1 Direct + Layer 2)

```typescript
{
  id: 'dash_finance_summary',
  name: 'Finance Summary',
  owner: 'user_nattha_mod',  // Moderator owns this
  
  access: {
    direct: {
      users: [
        'user_somchai_mod',   // Quick-shared with Somchai
        'user_teerak_user',   // Quick-shared with Teerak
      ],
      roles: [],
      groups: [],
    },
    company: {
      STTH: {
        roles: ['user'],
        groups: ['finance'],
      },
    },
  },
  restrictions: {
    revoke: [],
    expiry: {
      'user_teerak_user': new Date('2024-03-15'),  // Temporary access
    },
  },
}
```

**Accessible by:**
- ✅ Somchai (layer 1: direct user)
- ✅ Teerak (layer 1: direct user, expires 2024-03-15)
- ✅ All users in STTH (layer 2: role)
- ✅ All finance members (layer 2: group)

**Demonstrates:**
- Quick sharing (direct users)
- Expiry dates (time-limited access)
- Multiple permission layers combined

---

### Dashboard 3: Admin Only (Layer 1 - Role Only)

```typescript
{
  id: 'dash_hr_employee_data',
  name: 'Employee Data',
  owner: 'user_it_admin',
  
  access: {
    direct: {
      users: [],
      roles: ['admin'],  // Only admin role
      groups: [],
    },
    company: {},  // No company-wide access
  },
  restrictions: {
    revoke: [],
    expiry: {},
  },
}
```

**Accessible by:**
- ✅ Only John (admin)
- ❌ No one else

---

### Dashboard 4: User Revoked (Layer 3 - Explicit Deny)

```typescript
{
  id: 'dash_budget_2024',
  name: 'Budget 2024',
  
  access: {
    direct: {
      users: [],
      roles: [],
      groups: [],
    },
    company: {
      STTH: {
        roles: ['user', 'moderator'],
        groups: ['finance'],
      },
    },
  },
  restrictions: {
    revoke: ['user_teerak_user'],  // Teerak explicitly blocked
    expiry: {},
  },
}
```

**Accessible by:**
- ✅ Most users (layer 2: role/group)
- ❌ Teerak is revoked (layer 3 overrides layer 2)

**Demonstrates:**
- Explicit denial (restriction.revoke)
- Overrides other permission layers

---

### Dashboard 5: Temporary Project Access (Layer 1 with Expiry)

```typescript
{
  id: 'dash_project_q1_analytics',
  name: 'Project Q1 Analytics',
  type: 'custom',
  
  access: {
    direct: {
      users: [],
      roles: [],
      groups: ['project_q1'],  // Specific project group
    },
    company: {},
  },
  restrictions: {
    revoke: [],
    expiry: {
      'project_q1': new Date('2024-06-30'),  // Expires on project end
    },
  },
}
```

**Accessible by:**
- ✅ All project_q1 members until 2024-06-30
- ❌ Access expires on end date (automatic)

---

### Dashboard 6: Multiple Layer Access (Complex)

```typescript
{
  id: 'dash_sales_map',
  name: 'Regional Sales Map',
  
  access: {
    direct: {
      users: ['user_somchai_mod'],     // Direct user
      roles: ['moderator'],            // All moderators
      groups: ['sales'],               // All sales members
    },
    company: {
      STTH: {
        roles: ['user'],               // All users in STTH
        groups: ['operations'],        // Operations group
      },
    },
  },
  restrictions: {
    revoke: [],
    expiry: {},
  },
}
```

**Accessible by:**
- Layer 1: Somchai (direct), all moderators, all sales
- Layer 2: All users in STTH, operations group
- **Total: ~20+ users** (most of the organization)

---

### Dashboard 7: Deep Hierarchy (Tests Navigation)

```typescript
{
  id: 'dash_east_q1_forecast',
  name: 'East Q1 Forecast',
  folderId: 'folder_sales_reports_east',  // 3 levels deep
  
  access: {
    direct: { users: [], roles: [], groups: [] },
    company: {
      STTH: {
        roles: ['user'],
        groups: ['sales'],
      },
    },
  },
  restrictions: {
    revoke: [],
    expiry: {},
  },
}
```

**Tests:**
- Deep folder navigation (Sales > Reports > East)
- Breadcrumb generation
- Smart sidebar collapse

---

### Dashboard 8: Archived Dashboard

```typescript
{
  id: 'dash_old_legacy',
  name: 'Legacy Dashboard (Archived)',
  isArchived: true,
  archivedAt: new Date('2024-01-20'),
  
  access: {
    direct: { users: [], roles: [], groups: [] },
    company: {},
  },
  restrictions: {
    revoke: [],
    expiry: {},
  },
}
```

**Behavior:**
- Hidden from regular users
- Admin can still see
- Tests archived dashboard filtering

---

## 🔧 Usage in Components

### Example 1: Load Dashboards for Current User

```typescript
// In component
import { useDashboardService } from '~/composables/useDashboardService'

export default {
  setup() {
    const dashboardService = useDashboardService()
    const dashboards = ref([])

    onMounted(async () => {
      const currentUser = await dashboardService.getCurrentUser()
      if (currentUser) {
        const response = await dashboardService.getDashboards(
          currentUser.uid,
          currentUser.company,
          { folderId: 'folder_sales' }
        )
        dashboards.value = response.dashboards
      }
    })

    return { dashboards }
  },
}
```

---

### Example 2: Check If User Can Access Dashboard

```typescript
const canAccess = await dashboardService.canAccessDashboard(
  'dash_sales_east_performance',
  'user_somchai_mod'
)

const reason = await dashboardService.getAccessReason(
  'dash_sales_east_performance',
  'user_somchai_mod'
)
// Returns: { hasAccess: true, layer: 1, grantedBy: 'role', grantName: 'moderator' }
```

---

### Example 4: Get Access Explanation for UI Display

```typescript
// For dashboard card - show why user can access
const reason = await dashboardService.getAccessReason(
  dashboardId,
  currentUserId
)

// In template:
// "You can: View"
// "Access via: Company-scoped (role: user)"
```

---

## 🔄 Permission Check Algorithm

### 3-Layer Model Implementation

```typescript
function canAccess(user: User, dashboard: Dashboard): boolean {
  // Layer 3: Check restrictions first (explicit deny)
  if (restrictions.revoke.includes(user.uid)) {
    return false  // Explicitly revoked
  }

  if (restrictions.expiry[user.uid]) {
    if (now() > restrictions.expiry[user.uid]) {
      return false  // Access expired
    }
  }

  // Layer 1: Direct access (OR logic)
  if (access.direct.users.includes(user.uid)) {
    return true
  }
  if (access.direct.roles.includes(user.role)) {
    return true
  }
  if (user.groups.some(g => access.direct.groups.includes(g))) {
    return true
  }

  // Layer 2: Company-scoped (AND logic)
  if (access.company[user.company]) {
    const company = access.company[user.company]
    if (company.roles.includes(user.role)) {
      return true
    }
    if (user.groups.some(g => company.groups.includes(g))) {
      return true
    }
  }

  return false  // No match in any layer
}
```

---

## 🔌 Switching to Real Firebase

### Step 1: Create Firebase Service

```typescript
// app/composables/useFirebaseService.ts

export class FirebaseDashboardService implements IDashboardService {
  async getDashboards(userId: string): Promise<GetDashboardsResponse> {
    // Query Firestore
    const snap = await db
      .collection('dashboards')
      .where('access.direct.users', 'array-contains', userId)
      .get()

    return {
      dashboards: snap.docs.map(d => d.data()),
      total: snap.size,
      hasMore: false,
    }
  }

  // Implement other methods...
}
```

### Step 2: Switch Service

```typescript
// In plugin or main.ts
import { initializeDashboardService } from '~/composables/useDashboardService'

const firebaseService = new FirebaseDashboardService()
initializeDashboardService(firebaseService)
```

### Step 3: Components Stay Unchanged

```typescript
// This code works with BOTH mock and Firebase
const dashboardService = useDashboardService()
const dashboards = await dashboardService.getDashboards(userId, companyId)
```

---

## 📈 Test Scenarios Covered

| Scenario | Dashboard Example | Tests |
|----------|-------------------|-------|
| Public access | Sales East Performance | Layer 2 company-scoped |
| Quick share | Finance Summary | Layer 1 direct users + expiry |
| Admin only | HR Employee Data | Role-based access restriction |
| User revoked | Budget 2024 | Layer 3 explicit deny |
| Temp project | Q1 Analytics | Layer 1 group with expiry |
| Complex | Sales Map | Multiple layers combined |
| Deep hierarchy | East Q1 Forecast | 3+ level folder nesting |
| Archived | Legacy Dashboard | Hidden from regular users |

---

## ✅ Checklist for Integration

- [ ] Import types in components: `import type { ... } from '~/types/dashboard'`
- [ ] Use service: `const service = useDashboardService()`
- [ ] Set current user for mock: `service.setCurrentUser('user_somchai_mod')`
- [ ] Test permission checking: `await service.canAccessDashboard(...)`
- [ ] Test folder navigation: `await service.getFolders(...)`
- [ ] Test dashboard loading: `await service.getDashboards(...)`
- [ ] Prepare Firebase migration (for later)

---

## 📚 Related Files

- [app/types/dashboard.ts](../../app/types/dashboard.ts) - TypeScript interfaces
- [app/composables/useJSONMockService.ts](../../app/composables/useJSONMockService.ts) - JSON-backed mock service
- [app/composables/useDashboardService.ts](../../app/composables/useDashboardService.ts) - Service interface & implementation
- [docs/DESIGN/wireframes/dashboard-discover-page.md](./wireframes/dashboard-discover-page.md) - UI design
- [docs/GUIDES/roles-and-permissions.md](../GUIDES/roles-and-permissions.md) - Permission logic reference

---

**Created:** 2024-02-03  
**Status:** Ready for component development  
**Next Step:** Build Vue components using this data structure
