# Strategy 4: Hybrid Approach with Pinia & Composables

## Overview

**Strategy 4** is the recommended architecture for page reuse in StreamHub. It combines the best of all approaches:

- **Layout Composition** - Visual structure (AppLayout, DiscoverPageLayout)
- **Pinia Stores** - Centralized state management (dashboard, permissions)
- **Composables** - Reusable logic (useDashboardPage, usePaginatedList)
- **Generic Components** - Reusable UI (Button, Card, DashboardGrid)

This strategy provides **maximum reusability** with **minimum complexity**.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Discover Page                        │
│  (50 lines: pure presentation)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useDiscoveryPage()  ◄──  Composable (reusable logic)  │
│         │                                              │
│         ├─→ dashboardStore  ◄──  Pinia Store          │
│         │   (state, mutations)                         │
│         │                                              │
│         ├─→ permissionsStore  ◄──  Pinia Store        │
│         │   (permissions state)                        │
│         │                                              │
│         └─→ Dashboard Service  ◄──  API calls         │
│                                                        │
├─────────────────────────────────────────────────────────┤
│  DiscoverPageLayout  (composition layout)             │
│    ├─ FolderSidebar (feature component)               │
│    └─ DashboardGrid (feature component)               │
│        └─ DashboardCard (UI component)                │
└─────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. Pinia Stores - Centralized State

Two main stores manage application state:

#### Dashboard Store (`stores/dashboard.ts`)
Manages all dashboard and folder data:
- Dashboard list, folders list
- Selected folder/dashboard
- Loading states, errors
- Cache management
- Shared state across pages

```typescript
// Usage
const dashboardStore = useDashboardStore()
dashboardStore.setDashboards(dashboards)
dashboardStore.selectFolder(folderId)
```

#### Permissions Store (`stores/permissions.ts`)
Manages user access control:
- User role and permissions
- Feature access checks
- Permission-based UI rendering

```typescript
// Usage
const permissions = usePermissionsStore()
if (permissions.can('canCreateDashboard')) {
  // Show create button
}
```

### 2. Composables - Reusable Logic

Extract page logic into composables for maximum reusability:

#### `useDashboardPage` - Dashboard-Specific Logic
Encapsulates all dashboard page logic:
- Folder loading and selection
- Dashboard loading
- Permission checks
- Breadcrumb navigation
- Share dialog handling
- Infinite scroll setup

**Reuse**: Use in both `discover.vue` and `admin.vue` pages

```typescript
// In discover.vue
const {
  dashboards,
  folders,
  isLoading,
  canCreateFolder,
  selectFolder,
  handleViewDashboard,
} = useDashboardPage()
```

#### `usePaginatedList` - Generic Pagination Logic
Generic composable for any paginated list:
- Traditional pagination (prev/next/goto page)
- Infinite scroll support
- Empty state detection
- Error handling

**Reuse**: Use for dashboards, projects, users, any list

```typescript
// For dashboards (infinite scroll)
const { items, hasMore, loadMore } = usePaginatedList({
  pageSize: 20,
  enableInfiniteScroll: true,
  fetchFunction: async (page, pageSize) => {
    const res = await dashboardService.getDashboards(page, pageSize)
    return { items: res.dashboards, total: res.total }
  }
})

// For users (traditional pagination)
const { items, totalPages, currentPage, goToPage } = usePaginatedList({
  pageSize: 10,
  enableInfiniteScroll: false,
  fetchFunction: async (page, pageSize) => {
    const res = await userService.getUsers(page, pageSize)
    return { items: res.users, total: res.total }
  }
})
```

---

## Implementation Guide

### Step 1: Create Pinia Stores

Create a store for shared state:

```typescript
// stores/myFeature.ts
export const useMyFeatureStore = defineStore('myFeature', () => {
  // State
  const items = ref([])
  const selectedId = ref(null)

  // Mutations
  const setItems = (newItems) => {
    items.value = newItems
  }

  // Selectors
  const selectedItem = computed(() =>
    items.value.find(i => i.id === selectedId.value)
  )

  return {
    items,
    selectedId,
    selectedItem,
    setItems
  }
})
```

### Step 2: Create Composable Logic

Extract page logic into composable:

```typescript
// composables/useMyFeaturePage.ts
export const useMyFeaturePage = (options = {}) => {
  const store = useMyFeatureStore()
  const service = useMyFeatureService()

  const loadItems = async () => {
    store.setLoading(true)
    try {
      const data = await service.getItems()
      store.setItems(data)
    } catch (err) {
      store.setError(err.message)
    } finally {
      store.setLoading(false)
    }
  }

  onMounted(() => {
    loadItems()
  })

  return {
    items: computed(() => store.items),
    isLoading: computed(() => store.isLoading),
    loadItems
  }
}
```

### Step 3: Use in Page Component

Use composable in page (minimal code):

```vue
<template>
  <MyLayout>
    <MyGrid :items="items" :loading="isLoading" />
  </MyLayout>
</template>

<script setup lang="ts">
import { useMyFeaturePage } from '~/composables/useMyFeaturePage'

const { items, isLoading } = useMyFeaturePage()
</script>
```

---

## Permission-Based UI Control

The composable automatically integrates permissions:

### 1. Store Initialization

Connect permissions store to auth state:

```typescript
// In composable/useAuth.ts or on app init
import { usePermissionsStore } from '~/stores/permissions'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

watch(
  () => authStore.user,
  (user) => {
    permissionsStore.initializePermissions(user)
  },
  { immediate: true }
)
```

### 2. UI Component Binding

Use permissions in template:

```vue
<template>
  <!-- Show button only if user has permission -->
  <button v-if="canCreateDashboard" @click="create">
    Create Dashboard
  </button>

  <!-- Disable actions without permission -->
  <div v-if="canEditDashboard">
    <input v-model="title" />
  </div>
</template>

<script setup lang="ts">
const {
  canCreateDashboard,
  canEditDashboard
} = useDashboardPage()
</script>
```

### 3. Permission Checks

Check permissions at composable level:

```typescript
const handleShare = async (payload) => {
  // Check permission before action
  if (!permissionsStore.can('canShareDashboard')) {
    dashboardStore.setError('No permission to share')
    return
  }

  // Proceed with share
  await shareService.share(payload)
}
```

---

## Usage Examples

### Example 1: Dashboard Discovery Page (Current Implementation)

```vue
<template>
  <DiscoverPageLayout>
    <template #sidebar>
      <FolderSidebar
        :folders="folders"
        :allow-create="canCreateFolder"
        @select-folder="selectFolder"
      />
    </template>

    <DashboardGrid
      :dashboards="dashboards"
      :loading="isLoading"
      @view-dashboard="handleViewDashboard"
      @share-dashboard="handleShareDashboard"
    />
  </DiscoverPageLayout>
</template>

<script setup lang="ts">
const {
  dashboards,
  folders,
  isLoading,
  canCreateFolder,
  selectFolder,
  handleViewDashboard,
  handleShareDashboard,
} = useDashboardPage()
</script>
```

**Before (old approach)**: ~300 lines of inline logic
**After (Strategy 4)**: ~40 lines of pure presentation

### Example 2: Reusing for Admin Dashboard

```vue
<template>
  <AdminLayout>
    <DashboardGrid
      :dashboards="dashboards"
      :loading="isLoading"
      @edit-dashboard="handleEditDashboard"
      @delete-dashboard="handleDeleteDashboard"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
const {
  dashboards,
  isLoading,
  canEditDashboard,
  canDeleteDashboard,
  handleViewDashboard,
} = useDashboardPage({
  onDashboardSelect: (dashboard) => {
    // Admin-specific behavior
    editDashboard(dashboard)
  }
})
</script>
```

### Example 3: Reusing Permissions for Feature Flags

```typescript
// In any component
const permissions = usePermissionsStore()

// Show/hide experimental features
if (permissions.isAdmin) {
  enableExperimentalMode()
}

// Check multiple permissions
if (permissions.hasAll(['canEditDashboard', 'canShareDashboard'])) {
  showAdvancedActions()
}
```

---

## Benefits of Strategy 4

### 1. Maximum Reusability
```
One composable = Multiple pages
┌─────────────┐
│ Discover    │──┐
└─────────────┘  │
                 ├─→ useDashboardPage()
┌─────────────┐  │
│ Admin       │──┤
└─────────────┘  │
                 │
┌─────────────┐  │
│ Analytics   │──┘
└─────────────┘
```

### 2. Centralized State
```
One store = All pages synchronized
┌─────────────────────────────────────────┐
│  dashboardStore (Pinia)                 │
│  - dashboards[]                         │
│  - folders[]                            │
│  - selectedFolderId                     │
└─────────────────────────────────────────┘
           ▲        ▲        ▲
           │        │        │
      Discover  Admin  Analytics
      Updates simultaneously
```

### 3. Permission Integration
```
Permissions = Automatic UI Control
┌──────────────────────────────────┐
│ User: editor                     │
│ Permissions: computed auto      │
│ - canCreate: true               │
│ - canDelete: false              │
│ - canShare: true                │
└──────────────────────────────────┘
        │
        ├─→ canCreateFolder → show button
        ├─→ canDeleteDashboard → hide button
        └─→ canShareDashboard → enable share action
```

### 4. Clean Component Code
```
Before (old):
- 120 lines of state
- 60 lines of methods
- 50 lines of watchers
- 70 lines of lifecycle
= 300 lines of logic ❌

After (Strategy 4):
- 40 lines of composable usage
- 50 lines of template
= 90 lines total ✅

Code reduction: 70%
```

---

## Performance Optimization

### Store Caching

Stores implement cache management to avoid redundant API calls:

```typescript
// In composable
const isDashboardsCacheValid = (userId, folderId, company) => {
  return dashboardStore.isDashboardsCacheValid(userId, folderId, company)
}

if (isDashboardsCacheValid(uid, folderId, company)) {
  // Use cached data, don't call API
  return
}
```

### Computed Properties

Stores use computed properties for efficient data access:

```typescript
const selectedDashboard = computed(() =>
  dashboards.value.find(d => d.id === selectedId.value)
)
// Cached: only recomputes when dashboards or selectedId changes
```

### Infinite Scroll vs Pagination

Choose based on UX needs:

```typescript
// Infinite scroll (better for browse/discover)
const { items, hasMore, loadMore } = usePaginatedList({
  enableInfiniteScroll: true
})

// Traditional pagination (better for admin)
const { items, totalPages, goToPage } = usePaginatedList({
  enableInfiniteScroll: false
})
```

---

## Testing Strategy 4

### Unit Test Composable

```typescript
import { describe, it, expect, vi } from 'vitest'
import { useDashboardPage } from '~/composables/useDashboardPage'

describe('useDashboardPage', () => {
  it('loads dashboards on mount', async () => {
    // Mock service
    const mockService = {
      getDashboards: vi.fn().mockResolvedValue({
        dashboards: [{ id: '1', name: 'Dashboard 1' }]
      })
    }

    // Test composable
    const { dashboards, isLoading } = useDashboardPage()

    await flushPromises()

    expect(dashboards.value).toHaveLength(1)
    expect(isLoading.value).toBe(false)
  })

  it('checks permissions before sharing', async () => {
    const { handleShareDashboard, error } = useDashboardPage()
    const permissionsStore = usePermissionsStore()

    // No permission
    vi.spyOn(permissionsStore, 'can').mockReturnValue(false)

    handleShareDashboard({ id: '1' })

    expect(error.value).toBe('No permission to share')
  })
})
```

### Integration Test Page

```typescript
describe('Dashboard Discover Page', () => {
  it('renders dashboard grid from store', async () => {
    const { mount } = createWrapper()
    const wrapper = mount(DiscoverPage)

    await flushPromises()

    const grid = wrapper.findComponent(DashboardGrid)
    expect(grid.props('dashboards')).toHaveLength(4)
  })
})
```

---

## Migration Guide

### Migrating from Old Approach to Strategy 4

**Before:**
```typescript
// Old: All logic inline
const loadFolders = async () => { ... }
const loadDashboards = async () => { ... }
const handleShare = async () => { ... }
// 200+ lines of inline code
```

**After:**
```typescript
// New: Extract to composable
const { loadFolders, loadDashboards, handleShare } = useDashboardPage()
// 10 lines of composable usage
```

**Steps:**
1. Create composable (extract existing functions)
2. Create Pinia store (extract state)
3. Connect permissions store
4. Update page component
5. Test thoroughly
6. Deploy

---

## Troubleshooting

### Issue 1: Store State Not Syncing

**Problem:** Changes in one page don't reflect in another

**Solution:** Make sure using same store instance:
```typescript
// ✅ Correct
const store = useDashboardStore()

// ❌ Wrong - don't create new instances
const store = defineStore('dashboard', () => { ... })
```

### Issue 2: Permissions Not Working

**Problem:** Permission checks not blocking actions

**Solution:** Ensure permissions are initialized on auth:
```typescript
// In app.vue or middleware
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

watch(() => authStore.user, (user) => {
  permissionsStore.initializePermissions(user)
}, { immediate: true })
```

### Issue 3: Memory Leaks from Watchers

**Problem:** Composable keeps adding watchers on each use

**Solution:** Watchers are auto-cleaned by Vue, but ensure:
```typescript
// ✅ Correct - cleanup happens automatically
onMounted(() => {
  watch(...) // Auto-cleaned on unmount
})

// ❌ Wrong - manual cleanup not needed in Composition API
onMounted(() => {
  const unwatch = watch(...)
  onUnmounted(() => unwatch()) // Not necessary
})
```

---

## Best Practices

1. **One Store per Domain**
   - ✅ useProductStore, useUserStore, useDashboardStore
   - ❌ useGlobalStore, useEverythingStore

2. **Composable = Page Logic**
   - ✅ useDashboardPage (dashboard-specific)
   - ✅ usePaginatedList (generic, reusable)
   - ❌ useStuff, useHelpers (too vague)

3. **Components = Presentation Only**
   - ✅ Template + minimal business logic
   - ❌ Complex computed properties, side effects

4. **Permissions at Three Levels**
   ```typescript
   // Level 1: Data level (composable)
   if (!can('view')) return null

   // Level 2: Action level (handler)
   if (!can('edit')) return error

   // Level 3: UI level (template)
   v-if="can('delete')"
   ```

5. **Cache Invalidation**
   ```typescript
   // Clear cache when permissions change
   if (roleChanged) {
     dashboardStore.clearCache()
     loadDashboards()
   }
   ```

---

## Conclusion

Strategy 4 provides the best balance between **reusability**, **performance**, and **maintainability**. By combining Pinia stores, composables, and permissions management, you can build scalable applications with minimal code duplication.

**Key Takeaways:**
- ✅ Extract logic to composables (reuse)
- ✅ Manage state in Pinia stores (share)
- ✅ Integrate permissions (control)
- ✅ Keep components clean (presentation)
- ✅ Test composables (quality)
