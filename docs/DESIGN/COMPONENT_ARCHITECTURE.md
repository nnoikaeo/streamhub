# Component Architecture & Layout System

> **Purpose:** Define reusable component hierarchy to ensure consistent UI across all pages  
> **Problem Solved:** Prevents layout inconsistency when different pages define structure differently  
> **Created:** 2024-02-03

---

## 🎯 Core Principles

### **1. Layout Components = Foundation**
ทุก page ต้องใช้ layout component เดียวกัน ไม่อนุญาตให้ page กำหนด structure เองตามใจชอบ

### **2. Composition Components = Reusable Sections**
สร้าง reusable section components (e.g., Header, Sidebar, MainContent) ใช้ซ้ำได้ทุก page

### **3. UI Components = Building Blocks**
Generic components (Card, Button, Modal, etc.) ที่ reusable และ configurable

### **4. Feature Components = Page-Specific Logic**
Feature-specific components (DashboardCard, QuickShareDialog, PermissionEditor) อยู่บน foundation

---

## 🏗️ Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYOUT COMPONENTS                        │
│  (Enforce consistent page structure across app)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ AppLayout        │  │ AdminLayout      │                │
│  │ (Standard pages) │  │ (Admin panel)    │                │
│  └──────────────────┘  └──────────────────┘                │
│         │                      │                             │
│         ├─ Header              ├─ Header                    │
│         ├─ MainContent         ├─ AdminSidebar              │
│         └─ Footer              ├─ MainContent               │
│                                └─ Footer                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│             COMPOSITION/CONTAINER COMPONENTS                │
│  (Reusable multi-component sections)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ TwoPane Layout   │  │ DiscoverPageLayout                │
│  │ (Sidebar + Main) │  │ (Sidebar + Grid) │                │
│  └──────────────────┘  └──────────────────┘                │
│         │                      │                             │
│         ├─ DashboardSidebar    ├─ DashboardSidebar          │
│         └─ MainContentPane     └─ DashboardGrid             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│               REUSABLE UI COMPONENTS                        │
│  (Generic, configurable, reusable everywhere)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Button, Card, Modal, Input, Breadcrumb, etc.       │   │
│  │ All styled consistently with design system         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│             FEATURE/DOMAIN COMPONENTS                      │
│  (Page-specific, builds on UI components)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ DashboardCard    │  │ QuickShareDialog │                │
│  │ FolderTree       │  │ PermissionEditor │                │
│  │ DashboardGrid    │  │ AuditLog         │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 1. LAYOUT COMPONENTS (Structure Enforcers)

### **AppLayout** - Standard Page Layout
```
┌─────────────────────────────────────────────────┐
│                   Header                        │  Fixed height
├──────────────┬──────────────────────────────────┤
│   Sidebar    │         MainContent              │  Flex layout
│ (Optional)   │         (Scrollable)             │
│              │                                  │
│              │                                  │
│              │         [Slot: content]          │
│              │                                  │
│              │                                  │
├──────────────┴──────────────────────────────────┤
│                   Footer                        │  Fixed height
└─────────────────────────────────────────────────┘
```

**File:** `app/components/layouts/AppLayout.vue`

```typescript
<template>
  <div class="app-layout">
    <!-- Header (Fixed) -->
    <AppHeader :user="user" />

    <!-- Main Content Area -->
    <div class="layout-container">
      <!-- Optional Sidebar -->
      <div v-if="showSidebar" class="sidebar">
        <slot name="sidebar" />
      </div>

      <!-- Main Content (Scrollable) -->
      <div class="main-content">
        <slot />
      </div>
    </div>

    <!-- Footer (Fixed) -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
defineProps({
  showSidebar: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-container {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
</style>
```

**ทำความเข้าใจ:**
- ✅ **Consistent structure** - ทุก page ต้องใช้ layout นี้
- ✅ **Flexible content** - Slot ให้ page ใส่ content เองแล้ว layout จะ manage structure
- ✅ **Optional sidebar** - Prop บอก show/hide sidebar
- ✅ **Responsive** - Fixed header/footer + scrollable main area

---

### **AdminLayout** - Admin Panel Layout
```
┌─────────────────────────────────────────────────┐
│         Header (with Admin badge)               │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Admin       │        Admin Content             │
│  Sidebar     │        (Different styling)       │
│  (Menu)      │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

**File:** `app/components/layouts/AdminLayout.vue`

```typescript
<template>
  <div class="admin-layout">
    <!-- Admin Header -->
    <AdminHeader />

    <!-- Admin Container -->
    <div class="admin-container">
      <!-- Admin Sidebar (Navigation) -->
      <AdminSidebar />

      <!-- Admin Main Content -->
      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f3f4f6;
}

.admin-container {
  display: flex;
  flex: 1;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>
```

---

## 🧩 2. COMPOSITION COMPONENTS (Reusable Sections)

### **TwoPaneLayout** - Sidebar + Main Content Pattern
สำหรับ pages ที่ใช้ pattern: Sidebar (folder tree) + Main (content grid)

**File:** `app/components/compositions/TwoPaneLayout.vue`

```typescript
<template>
  <AppLayout show-sidebar>
    <template #sidebar>
      <!-- Left: Sidebar (Reusable) -->
      <div class="two-pane-sidebar">
        <slot name="sidebar" />
      </div>
    </template>

    <!-- Right: Main Content -->
    <div class="two-pane-content">
      <!-- Top: Header/Breadcrumb -->
      <div class="content-header">
        <slot name="header" />
      </div>

      <!-- Middle: Main Content (Grid/List) -->
      <div class="content-main">
        <slot />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.two-pane-sidebar {
  padding: 1rem;
  border-right: 1px solid #e5e7eb;
}

.two-pane-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.content-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.content-main {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
</style>
```

**Usage in Dashboard Discover Page:**
```vue
<template>
  <TwoPaneLayout>
    <!-- Sidebar: Folder tree -->
    <template #sidebar>
      <FolderSidebar 
        :folders="folders"
        @folder-selected="onFolderSelected"
      />
    </template>

    <!-- Header: Breadcrumb + Search -->
    <template #header>
      <BreadcrumbNavigation :path="currentPath" />
      <DashboardSearchBar />
    </template>

    <!-- Main: Dashboard grid -->
    <DashboardGrid :dashboards="dashboards" />
  </TwoPaneLayout>
</template>
```

---

### **DiscoverPageLayout** - Discover Page Specific
**File:** `app/components/compositions/DiscoverPageLayout.vue`

```typescript
<template>
  <TwoPaneLayout>
    <template #sidebar>
      <FolderSidebar 
        :folders="accessibleFolders"
        :current-folder="currentFolderId"
        @select="onFolderSelect"
      />
    </template>

    <template #header>
      <div class="discover-header">
        <BreadcrumbNavigation :path="folderPath" />
        <div class="header-actions">
          <DashboardSearchBar @search="onSearch" />
          <SortDropdown @sort="onSort" />
        </div>
      </div>
    </template>

    <!-- Main Grid -->
    <DashboardGrid 
      :dashboards="filteredDashboards"
      :loading="loading"
      @dashboard-open="onDashboardOpen"
      @dashboard-share="onDashboardShare"
      @dashboard-delete="onDashboardDelete"
    />
  </TwoPaneLayout>
</template>
```

---

## 🎨 3. REUSABLE UI COMPONENTS (Design System)

### **Button Component**
**File:** `app/components/ui/Button.vue`

```typescript
<template>
  <button 
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: Boolean
})

const buttonClasses = computed(() => ({
  'btn': true,
  [`btn-${variant}`]: true,
  [`btn-${size}`]: true,
  'disabled': disabled
}))
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

**Usage everywhere:**
```vue
<Button variant="primary" size="md" @click="handleClick">
  Save Changes
</Button>
```

---

### **Card Component** - Consistent Card Display
**File:** `app/components/ui/Card.vue`

```typescript
<template>
  <div class="card" :class="{ 'card-hover': clickable }">
    <!-- Card Header (Optional) -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <slot />
    </div>

    <!-- Card Footer (Optional) -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  clickable: Boolean
})
</script>

<style scoped>
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.card-hover:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}

.card-body {
  padding: 1rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}
</style>
```

**Usage:**
```vue
<Card clickable @click="openDashboard">
  <template #header>
    <h3>Dashboard Name</h3>
  </template>

  <p>Dashboard description</p>

  <template #footer>
    <Button variant="primary">Open</Button>
  </template>
</Card>
```

---

### **Modal Component**
**File:** `app/components/ui/Modal.vue`

```typescript
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="close">
        <div class="modal" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h2>{{ title }}</h2>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <slot name="footer">
              <Button variant="secondary" @click="close">
                Cancel
              </Button>
              <Button variant="primary" @click="$emit('confirm')">
                Confirm
              </Button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps({
  modelValue: Boolean,
  title: String
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
```

---

## 🎯 4. FEATURE COMPONENTS (Domain Logic)

### **DashboardCard** - Dashboard Display Card
**File:** `app/components/features/DashboardCard.vue`

```typescript
<template>
  <Card 
    clickable
    :data-testid="`dashboard-card-${dashboard.id}`"
    @click="$emit('open')"
  >
    <template #header>
      <div class="card-title">
        <h3>{{ dashboard.name }}</h3>
        <span class="dashboard-icon">
          {{ getTypeIcon(dashboard.type) }}
        </span>
      </div>
    </template>

    <!-- Metadata -->
    <div class="metadata">
      <p class="creator">By: {{ getCreatorName(dashboard.owner) }}</p>
      <p class="updated">Updated: {{ formatDate(dashboard.updatedAt) }}</p>
    </div>

    <!-- Access Info -->
    <div class="access-info">
      <p class="access-label">Access via:</p>
      <div class="access-badge" :class="`layer-${accessReason.layer}`">
        {{ accessReasonText }}
      </div>
    </div>

    <!-- Actions Footer -->
    <template #footer>
      <div class="card-actions">
        <Button variant="primary" size="sm">Open →</Button>

        <!-- Role-based action buttons -->
        <template v-if="canEdit">
          <Button variant="secondary" size="sm" @click.stop="$emit('edit')">
            Edit
          </Button>
        </template>

        <template v-if="canShare">
          <Button variant="secondary" size="sm" @click.stop="$emit('share')">
            Share
          </Button>
        </template>

        <template v-if="canManageAccess">
          <Button variant="secondary" size="sm" @click.stop="$emit('manage-access')">
            Manage Access
          </Button>
        </template>

        <template v-if="canDelete">
          <Button variant="danger" size="sm" @click.stop="$emit('delete')">
            Delete
          </Button>
        </template>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import type { DashboardCardData } from '~/types/dashboard'

defineProps<{
  dashboard: DashboardCardData
  accessReason: {
    layer: 1 | 2 | 3
    grantedBy: 'user' | 'role' | 'group'
    grantName: string
  }
}>()

defineEmits(['open', 'edit', 'share', 'manage-access', 'delete'])

const { canEdit, canShare, canDelete, canManageAccess } = usePermissions()
</script>

<style scoped>
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-icon {
  font-size: 1.5rem;
}

.metadata {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0;
}

.access-info {
  margin: 0.5rem 0;
}

.access-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.layer-1 {
  background-color: #dbeafe;
  color: #0c4a6e;
}

.layer-2 {
  background-color: #d1fae5;
  color: #065f46;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
```

---

### **DashboardGrid** - Reusable Grid Container
**File:** `app/components/features/DashboardGrid.vue`

```typescript
<template>
  <div class="dashboard-grid-wrapper">
    <!-- Results info -->
    <div class="results-header">
      <p class="results-count">
        {{ dashboards.length }} dashboard{{ dashboards.length !== 1 ? 's' : '' }} found
      </p>
    </div>

    <!-- Grid -->
    <div v-if="dashboards.length > 0" class="dashboard-grid">
      <DashboardCard
        v-for="dashboard in dashboards"
        :key="dashboard.id"
        :dashboard="dashboard"
        :access-reason="dashboard.accessReason"
        @open="$emit('open', dashboard.id)"
        @edit="$emit('edit', dashboard.id)"
        @share="$emit('share', dashboard.id)"
        @manage-access="$emit('manage-access', dashboard.id)"
        @delete="$emit('delete', dashboard.id)"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>📭 No dashboards found</p>
      <p class="empty-message">Try adjusting your search or filters</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardCardData } from '~/types/dashboard'

defineProps<{
  dashboards: DashboardCardData[]
}>()

defineEmits(['open', 'edit', 'share', 'manage-access', 'delete'])
</script>

<style scoped>
.dashboard-grid-wrapper {
  width: 100%;
}

.results-header {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-message {
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

---

### **FolderSidebar** - Reusable Folder Tree
**File:** `app/components/features/FolderSidebar.vue`

```typescript
<template>
  <div class="folder-sidebar">
    <div class="sidebar-header">
      <h3>📁 Folders</h3>
    </div>

    <!-- Folder Tree -->
    <FolderTree
      :folders="folders"
      :current-folder-id="currentFolderId"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/types/dashboard'

defineProps<{
  folders: Folder[]
  currentFolderId?: string
}>()

defineEmits(['select'])
</script>

<style scoped>
.folder-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
}
</style>
```

---

## 📋 Component File Structure

```
app/components/
├── layouts/
│  ├── AppLayout.vue              # Standard layout
│  └── AdminLayout.vue            # Admin panel layout
│
├── ui/                           # Design system (reusable)
│  ├── Button.vue
│  ├── Card.vue
│  ├── Modal.vue
│  ├── Input.vue
│  ├── Select.vue
│  ├── Breadcrumb.vue
│  └── Badge.vue
│
├── compositions/                 # Composition patterns
│  ├── TwoPaneLayout.vue
│  ├── DiscoverPageLayout.vue
│  └── AdminPanelLayout.vue
│
└── features/                     # Domain-specific
   ├── DashboardCard.vue
   ├── DashboardGrid.vue
   ├── FolderSidebar.vue
   ├── FolderTree.vue
   ├── QuickShareDialog.vue
   ├── PermissionEditor.vue
   └── AuditLog.vue
```

---

## 🚀 Page Implementation Using Components

### **Dashboard Discover Page**
```typescript
// pages/dashboards/index.vue

<template>
  <DiscoverPageLayout>
    <!-- Everything else handled by layout -->
  </DiscoverPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDashboardService } from '~/composables/useDashboardService'

const dashboardService = useDashboardService()
const dashboards = ref([])
const folders = ref([])

onMounted(async () => {
  // Load data
  const response = await dashboardService.getDashboards(
    currentUser.value.uid,
    currentUser.value.company
  )
  dashboards.value = response.dashboards
})
</script>
```

✅ **Page is CLEAN** - No layout definition, just uses DiscoverPageLayout
✅ **Consistent** - All discover pages look identical
✅ **Reusable** - Layout can be used by multiple pages

---

### **Admin Permission Page**
```typescript
// pages/admin/permissions.vue

<template>
  <AdminLayout>
    <PermissionEditor :dashboard="selectedDashboard" />
  </AdminLayout>
</template>

<script setup lang="ts">
// Layout handles structure, component handles logic
</script>
```

---

## ✅ ต้องสร้าง Components ตามลำดับนี้:

### **Phase 1: Layouts (Foundation)**
- [ ] `AppLayout.vue` - base structure
- [ ] `AdminLayout.vue` - admin variant

### **Phase 2: UI Components (Design System)**
- [ ] `Button.vue`
- [ ] `Card.vue`
- [ ] `Modal.vue`
- [ ] `Input.vue`
- [ ] `Breadcrumb.vue`
- [ ] `Badge.vue`

### **Phase 3: Composition Components (Patterns)**
- [ ] `TwoPaneLayout.vue`
- [ ] `DiscoverPageLayout.vue`
- [ ] `AdminPanelLayout.vue`

### **Phase 4: Feature Components (Logic)**
- [ ] `DashboardCard.vue`
- [ ] `DashboardGrid.vue`
- [ ] `FolderSidebar.vue`
- [ ] `FolderTree.vue`
- [ ] `QuickShareDialog.vue`
- [ ] `PermissionEditor.vue`

---

## 💡 Key Benefits

| Problem | Solution |
|---------|----------|
| Layout inconsistency | Layout components enforce structure |
| Repeated code | Composition components reuse patterns |
| Style inconsistency | Design system (UI components) |
| Hard to maintain | Clear hierarchy & file structure |
| Pages too complex | Pages just use layouts, not build structure |

---

**Next:** Create components starting with Phase 1 (Layouts)? 🎯
