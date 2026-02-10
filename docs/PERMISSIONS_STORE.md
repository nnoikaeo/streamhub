# Permissions Store - Role-Based Access Control

## Overview

The **Permissions Store** (`stores/permissions.ts`) manages user access control and permissions in StreamHub using Pinia. It integrates with the authentication system to provide role-based access control (RBAC) for UI components and features.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            User Authentication                      │
│  (Google, Firebase, etc.)                           │
└─────────────────────────────────────────────────────┘
              │
              │ user.role
              ▼
┌─────────────────────────────────────────────────────┐
│         Permissions Store (Pinia)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  currentUser: UserData                        │  │
│  │  userRole: 'admin' | 'editor' | 'viewer'     │  │
│  │  permissions: FeaturePermissions              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Methods:                                     │  │
│  │  - can(permission)                            │  │
│  │  - hasAll(permissions)                        │  │
│  │  - hasAny(permissions)                        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
              │
              ├─→ Components (UI control)
              ├─→ Composables (action control)
              └─→ Pages (feature control)
```

---

## Role-Based Permissions

### Defined Roles

StreamHub has 4 predefined roles:

#### 1. Admin
Full access to all features and settings
```typescript
{
  canViewDashboards: true,
  canCreateDashboard: true,
  canEditDashboard: true,
  canDeleteDashboard: true,
  canShareDashboard: true,
  canCreateFolder: true,
  canEditFolder: true,
  canDeleteFolder: true,
  canAccessAdmin: true,
  canManageUsers: true,
}
```

#### 2. Editor
Can create and edit content, but cannot manage users
```typescript
{
  canViewDashboards: true,
  canCreateDashboard: true,
  canEditDashboard: true,
  canDeleteDashboard: true,
  canShareDashboard: true,
  canCreateFolder: true,
  canEditFolder: true,
  canDeleteFolder: false,    // ← Cannot delete
  canAccessAdmin: false,     // ← No admin access
  canManageUsers: false,     // ← Cannot manage users
}
```

#### 3. Viewer
Read-only access
```typescript
{
  canViewDashboards: true,
  canCreateDashboard: false,
  canEditDashboard: false,
  canDeleteDashboard: false,
  canShareDashboard: false,
  canCreateFolder: false,
  canEditFolder: false,
  canDeleteFolder: false,
  canAccessAdmin: false,
  canManageUsers: false,
}
```

#### 4. User (Default)
Same as Viewer for new/default users
```typescript
{
  // Same as Viewer
  canViewDashboards: true,
  canCreateDashboard: false,
  // ...
}
```

---

## Store API

### Initialization

**Initialize permissions when user logs in:**

```typescript
import { usePermissionsStore } from '~/stores/permissions'

const permissionsStore = usePermissionsStore()

// Called on login
permissionsStore.initializePermissions(userData)
```

### Methods

#### `can(permission: keyof FeaturePermissions): boolean`

Check if user has a single permission:

```typescript
if (permissionsStore.can('canCreateDashboard')) {
  showCreateButton()
}

if (permissionsStore.can('canManageUsers')) {
  showAdminPanel()
}
```

#### `hasAll(permissions: string[]): boolean`

Check if user has ALL permissions in a list (AND logic):

```typescript
// Only show if user can both edit AND share
if (permissionsStore.hasAll(['canEditDashboard', 'canShareDashboard'])) {
  showAdvancedActions()
}
```

#### `hasAny(permissions: string[]): boolean`

Check if user has ANY permission in a list (OR logic):

```typescript
// Show if user can either edit OR delete
if (permissionsStore.hasAny(['canEditDashboard', 'canDeleteDashboard'])) {
  showEditMenu()
}
```

#### `getAllPermissions(): FeaturePermissions`

Get all permissions as object:

```typescript
const allPerms = permissionsStore.getAllPermissions()
console.log(allPerms)
// Output:
// {
//   canViewDashboards: true,
//   canCreateDashboard: true,
//   ...
// }
```

### Computed Properties

#### `isAdmin: boolean`

Check if user is admin:

```typescript
if (permissionsStore.isAdmin) {
  enableDangerousActions()
}
```

#### `isEditor: boolean`

Check if user is editor or admin:

```typescript
if (permissionsStore.isEditor) {
  showEditingTools()
}
```

#### `canModifyContent: boolean`

Check if user can create or edit (modify):

```typescript
if (permissionsStore.canModifyContent) {
  enableFormMode()
}
```

---

## Integration Examples

### 1. Permission Checks in Components

**Template-level checks:**

```vue
<template>
  <div>
    <!-- Show create button only if permitted -->
    <button v-if="permissions.can('canCreateDashboard')">
      Create Dashboard
    </button>

    <!-- Show admin panel only for admins -->
    <AdminPanel v-if="permissions.isAdmin" />

    <!-- Disable actions without permission -->
    <div :class="{ disabled: !permissions.can('canEditDashboard') }">
      <input v-model="title" :disabled="!permissions.can('canEditDashboard')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissionsStore } from '~/stores/permissions'

const permissions = usePermissionsStore()
</script>
```

### 2. Permission Checks in Composables

**Action-level checks:**

```typescript
export const useDashboardPage = () => {
  const permissions = usePermissionsStore()
  const dashboardStore = useDashboardStore()

  const handleShare = async (payload) => {
    // Check permission before executing action
    if (!permissions.can('canShareDashboard')) {
      dashboardStore.setError('You do not have permission to share dashboards')
      return
    }

    // Execute action
    await shareService.share(payload)
  }

  const handleDelete = async (dashboardId) => {
    // Check permission
    if (!permissions.can('canDeleteDashboard')) {
      dashboardStore.setError('You do not have permission to delete dashboards')
      return
    }

    // Execute action
    await dashboardService.delete(dashboardId)
  }

  return {
    handleShare,
    handleDelete,
  }
}
```

### 3. Permission Checks in Pages

**Page-level feature gates:**

```vue
<template>
  <!-- Hide entire admin section if not admin -->
  <AdminLayout v-if="permissions.isAdmin">
    <UserManagement />
    <Settings />
  </AdminLayout>

  <!-- Show discovery page for all users with view permission -->
  <DiscoverLayout v-else-if="permissions.can('canViewDashboards')">
    <DashboardGrid />
  </DiscoverLayout>

  <!-- Show access denied for others -->
  <AccessDenied v-else />
</template>

<script setup lang="ts">
const { permissionsStore } = useDashboardPage()
const permissions = permissionsStore
</script>
```

---

## Practical Examples

### Example 1: Conditional Create Button

**Show/hide create button based on permission:**

```vue
<template>
  <div class="dashboard-header">
    <h1>My Dashboards</h1>

    <!-- Create button only visible to editors and admins -->
    <button
      v-if="permissions.can('canCreateDashboard')"
      @click="showCreateDialog = true"
      class="btn-primary"
    >
      + Create Dashboard
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePermissionsStore } from '~/stores/permissions'

const permissions = usePermissionsStore()
const showCreateDialog = ref(false)
</script>
```

### Example 2: Permission-Based Menu Actions

**Show different menu options based on permissions:**

```vue
<template>
  <div class="dashboard-card">
    <h3>{{ dashboard.name }}</h3>

    <!-- Context menu -->
    <Menu>
      <!-- Always show view -->
      <MenuItem @click="view">View</MenuItem>

      <!-- Only show share if permitted -->
      <MenuItem
        v-if="permissions.can('canShareDashboard')"
        @click="share"
      >
        Share
      </MenuItem>

      <!-- Only show edit if permitted -->
      <MenuItem
        v-if="permissions.can('canEditDashboard')"
        @click="edit"
      >
        Edit
      </MenuItem>

      <!-- Divider -->
      <MenuDivider
        v-if="permissions.can('canDeleteDashboard')"
      />

      <!-- Only show delete if permitted -->
      <MenuItem
        v-if="permissions.can('canDeleteDashboard')"
        @click="delete"
        class="text-red-600"
      >
        Delete
      </MenuItem>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { usePermissionsStore } from '~/stores/permissions'

const permissions = usePermissionsStore()

const view = () => { /* ... */ }
const share = () => { /* ... */ }
const edit = () => { /* ... */ }
const delete = () => { /* ... */ }
</script>
```

### Example 3: Form Accessibility Control

**Disable form fields based on edit permission:**

```vue
<template>
  <form>
    <label>Dashboard Name</label>
    <input
      v-model="form.name"
      :disabled="!permissions.can('canEditDashboard')"
      placeholder="Dashboard name"
    />

    <label>Description</label>
    <textarea
      v-model="form.description"
      :disabled="!permissions.can('canEditDashboard')"
      placeholder="Dashboard description"
    />

    <!-- Save button only visible if can edit -->
    <button
      v-if="permissions.can('canEditDashboard')"
      type="submit"
      class="btn-primary"
    >
      Save Changes
    </button>

    <!-- View-only message if no edit permission -->
    <div
      v-else
      class="text-gray-500"
    >
      You do not have permission to edit this dashboard
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { usePermissionsStore } from '~/stores/permissions'

const permissions = usePermissionsStore()

const form = reactive({
  name: 'My Dashboard',
  description: 'Dashboard description'
})
</script>
```

### Example 4: Feature-Level Access Control

**Hide entire features based on admin permission:**

```vue
<template>
  <div class="app-sidebar">
    <!-- Navigation always visible -->
    <nav>
      <NavItem to="/dashboard/discover">Discover</NavItem>
      <NavItem v-if="permissions.can('canViewDashboards')" to="/dashboard/my">
        My Dashboards
      </NavItem>
    </nav>

    <!-- Admin section only for admins -->
    <div v-if="permissions.isAdmin" class="admin-section">
      <h3>Admin</h3>
      <NavItem to="/admin/users">Manage Users</NavItem>
      <NavItem to="/admin/settings">Settings</NavItem>
      <NavItem to="/admin/audit">Audit Log</NavItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissionsStore } from '~/stores/permissions'

const permissions = usePermissionsStore()
</script>
```

---

## Advanced Usage

### Custom Permission Checks

**Extend with custom logic:**

```typescript
const permissionsStore = usePermissionsStore()

// Check if user can manage specific resource
const canManageResource = (resource, userId) => {
  if (!permissionsStore.can('canEditDashboard')) {
    return false
  }

  // Additional logic: only own resources
  return resource.ownerId === userId
}

if (canManageResource(dashboard, currentUserId)) {
  showManageButton()
}
```

### Multiple Permission Groups

**Check multiple permission combinations:**

```typescript
// Can do "advanced" editing (edit + share + delete)
const canDoAdvancedEditing = permissionsStore.hasAll([
  'canEditDashboard',
  'canShareDashboard',
  'canDeleteDashboard'
])

// Can do "basic" operations (view + create OR edit)
const canDoBasicOperations = permissionsStore.hasAny([
  'canCreateDashboard',
  'canEditDashboard'
])
```

### Dynamic Permission Levels

**Adjust UI based on permission level:**

```typescript
const getEditMode = () => {
  if (permissionsStore.can('canEditDashboard')) {
    return 'edit'
  } else if (permissionsStore.can('canViewDashboards')) {
    return 'view'
  } else {
    return 'none'
  }
}

const editMode = computed(() => getEditMode())
```

---

## Integration with Auth

### Complete Setup

**1. Initialize on app startup:**

```typescript
// app.vue or main middleware
import { useAuthStore } from '~/stores/auth'
import { usePermissionsStore } from '~/stores/permissions'

export default {
  setup() {
    const authStore = useAuthStore()
    const permissionsStore = usePermissionsStore()

    // Initialize permissions when user logs in
    watch(
      () => authStore.user,
      (user) => {
        if (user) {
          permissionsStore.initializePermissions(user)
        } else {
          permissionsStore.initializePermissions(null)
        }
      },
      { immediate: true }
    )
  }
}
```

**2. Check permissions in routes:**

```typescript
// middleware/canView.ts
export default defineRouteMiddleware((to, from) => {
  const permissionsStore = usePermissionsStore()

  if (!permissionsStore.can('canViewDashboards')) {
    return navigateTo('/access-denied')
  }
})

// In route definition
routes: [
  {
    path: '/dashboard/discover',
    middleware: 'canView'
  }
]
```

---

## Testing

### Unit Tests for Permissions Store

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionsStore } from '~/stores/permissions'

describe('Permissions Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes admin permissions correctly', () => {
    const store = usePermissionsStore()
    const adminUser = { uid: '123', email: 'admin@example.com', role: 'admin' }

    store.initializePermissions(adminUser)

    expect(store.can('canCreateDashboard')).toBe(true)
    expect(store.can('canDeleteDashboard')).toBe(true)
    expect(store.can('canManageUsers')).toBe(true)
    expect(store.isAdmin).toBe(true)
  })

  it('initializes viewer permissions correctly', () => {
    const store = usePermissionsStore()
    const viewerUser = { uid: '456', email: 'viewer@example.com', role: 'viewer' }

    store.initializePermissions(viewerUser)

    expect(store.can('canViewDashboards')).toBe(true)
    expect(store.can('canCreateDashboard')).toBe(false)
    expect(store.can('canDeleteDashboard')).toBe(false)
    expect(store.isAdmin).toBe(false)
  })

  it('checks multiple permissions with hasAll', () => {
    const store = usePermissionsStore()
    const editorUser = { uid: '789', email: 'editor@example.com', role: 'editor' }

    store.initializePermissions(editorUser)

    expect(store.hasAll(['canEditDashboard', 'canShareDashboard'])).toBe(true)
    expect(store.hasAll(['canEditDashboard', 'canDeleteDashboard'])).toBe(false)
  })

  it('checks multiple permissions with hasAny', () => {
    const store = usePermissionsStore()
    const viewerUser = { uid: '456', email: 'viewer@example.com', role: 'viewer' }

    store.initializePermissions(viewerUser)

    expect(store.hasAny(['canCreateDashboard', 'canViewDashboards'])).toBe(true)
    expect(store.hasAny(['canCreateDashboard', 'canDeleteDashboard'])).toBe(false)
  })

  it('resets permissions on logout', () => {
    const store = usePermissionsStore()
    const adminUser = { uid: '123', email: 'admin@example.com', role: 'admin' }

    store.initializePermissions(adminUser)
    expect(store.isAdmin).toBe(true)

    store.initializePermissions(null)
    expect(store.can('canViewDashboards')).toBe(false)
    expect(store.isAdmin).toBe(false)
  })
})
```

---

## Performance Considerations

### 1. Computed Properties

Permissions are computed and cached:

```typescript
const isAdmin = computed(() => userRole.value === 'admin')
// Only recomputes when userRole changes
```

### 2. Permission Checking

Permission checks are fast (direct property lookups):

```typescript
// Fast: O(1) lookup
can('canCreateDashboard')

// Fast: linear scan of small array
hasAll(['can1', 'can2'])

// Still fast: small permission set
```

### 3. Avoid Repeated Checks

Cache permission results in component state:

```vue
<script setup lang="ts">
const permissions = usePermissionsStore()

// ✅ Good: check once in setup
const canEdit = computed(() => permissions.can('canEditDashboard'))

// ❌ Bad: check multiple times in template
// <button v-if="permissions.can('canEditDashboard')">
// <button v-if="permissions.can('canEditDashboard')">
// <button v-if="permissions.can('canEditDashboard')">
</script>
```

---

## Best Practices

1. **Initialize on Login**
   ```typescript
   // ✅ Call on user login
   permissionsStore.initializePermissions(user)
   ```

2. **Check Permissions at Three Levels**
   ```typescript
   // Level 1: Template (UI visibility)
   v-if="can('create')"

   // Level 2: Composable (action control)
   if (!can('create')) return error

   // Level 3: Backend (data validation)
   backend validates permission
   ```

3. **Use Computed for Multi-Checks**
   ```typescript
   // ✅ Cache the result
   const canEdit = computed(() =>
     permissions.hasAll(['edit', 'share'])
   )

   // ❌ Don't repeat the check
   if (permissions.hasAll([...])) { ... }
   if (permissions.hasAll([...])) { ... }
   ```

4. **Clear on Logout**
   ```typescript
   // ✅ Reset on logout
   permissionsStore.initializePermissions(null)
   ```

5. **Document Permission Requirements**
   ```typescript
   /**
    * Share dashboard
    * @requires canShareDashboard permission
    * @requires admin or editor role
    */
   const handleShare = async () => { ... }
   ```

---

## Troubleshooting

### Issue: Permissions not updating after role change

**Solution:** Reinitialize permissions when role changes
```typescript
const refreshPermissions = () => {
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()
  permissionsStore.initializePermissions(authStore.user)
}
```

### Issue: Permission checks not working in component

**Solution:** Ensure store is initialized before component renders
```typescript
// In middleware or auth composable
if (!authStore.user) {
  return navigateTo('/login')
}
```

### Issue: Template shows content for unauthorized user

**Solution:** Use v-if instead of conditional classes for sensitive content
```vue
<!-- ❌ Wrong: still renders in DOM -->
<button :style="{ display: can('delete') ? 'block' : 'none' }">
  Delete
</button>

<!-- ✅ Correct: not in DOM -->
<button v-if="can('delete')">
  Delete
</button>
```

---

## Summary

The Permissions Store provides a clean, performant way to manage role-based access control in StreamHub. By integrating with Pinia and the authentication system, it enables:

- ✅ Centralized permission management
- ✅ Role-based access control
- ✅ Permission-based UI rendering
- ✅ Action-level access checks
- ✅ Automatic cache management
- ✅ Easy testing and debugging

Use it throughout your components, composables, and pages to build secure, user-friendly features.
