# Component Auto-Import Conventions

## Overview

StreamHub uses Nuxt 3's auto-import feature with component prefixes to organize components into a 4-layer architecture:

1. **Layout Components** (Foundation) - Page structure
2. **Composition Components** (Reusable Sections) - Page compositions
3. **UI Components** (Building Blocks) - Generic reusable elements
4. **Feature Components** (Domain-Specific) - Feature-specific logic

## Component Organization

### 1. Layout Components

**Location:** `app/components/layouts/`
**Auto-Import Prefix:** `Layout`
**Usage:** Define page structure (header, sidebar, footer)

#### Registered Components:
```
AppLayout.vue              → <LayoutAppLayout>
AdminLayout.vue            → <LayoutAdminLayout>
AuthLayout.vue             → <LayoutAuthLayout> (to be created)
```

#### Example Usage:
```vue
<template>
  <LayoutAppLayout>
    <PageHeader title="Dashboard" />
    <div class="content">
      <!-- page content -->
    </div>
  </LayoutAppLayout>
</template>
```

### 2. UI Components

**Location:** `app/components/ui/`
**Auto-Import Prefix:** (none)
**Usage:** Reusable UI elements (buttons, cards, inputs, etc.)

#### Registered Components:
```
Button.vue                 → <Button>
Card.vue                   → <Card>
Modal.vue                  → <Modal>
Input.vue                  → <Input>
Breadcrumb.vue             → <Breadcrumb>
AppHeader.vue              → <AppHeader>
AppFooter.vue              → <AppFooter>
AdminHeader.vue            → <AdminHeader>
Badge.vue                  → <Badge>
```

#### Example Usage:
```vue
<template>
  <Card interactive padding="lg">
    <template #header>
      <h3>Card Title</h3>
    </template>
    <p>Card content</p>
    <template #footer>
      <Button>Action</Button>
    </template>
  </Card>
</template>
```

### 3. Composition Components

**Location:** `app/components/compositions/`
**Auto-Import Prefix:** `Composition`
**Usage:** Combine UI components into functional sections

#### Registered Components:
```
TwoPaneLayout.vue          → <CompositionTwoPaneLayout>
DiscoverPageLayout.vue     → <CompositionDiscoverPageLayout>
AdminPanelLayout.vue       → <CompositionAdminPanelLayout>
```

#### Example Usage:
```vue
<template>
  <CompositionDiscoverPageLayout>
    <template #sidebar>
      <FolderSidebar />
    </template>
    <DashboardGrid />
  </CompositionDiscoverPageLayout>
</template>
```

### 4. Feature Components

**Location:** `app/components/features/`
**Auto-Import Prefix:** `Feature`
**Usage:** Feature-specific components with domain logic

#### Registered Components:
```
DashboardCard.vue          → <FeatureDashboardCard>
DashboardGrid.vue          → <FeatureDashboardGrid>
DashboardViewHeader.vue    → <FeatureDashboardViewHeader>
DashboardHeader.vue        → <FeatureDashboardHeader>
FolderSidebar.vue          → <FeatureFolderSidebar>
FolderTree.vue             → <FeatureFolderTree>
FolderInfoCard.vue         → <FeatureFolderInfoCard>
QuickShareDialog.vue       → <FeatureQuickShareDialog>
PermissionEditor.vue       → <FeaturePermissionEditor>
```

#### Example Usage:
```vue
<template>
  <FeatureDashboardCard
    :dashboard="dashboard"
    @view="handleView"
    @share="handleShare"
  />
</template>
```

## Configuration

### Nuxt Config (nuxt.config.ts)

```typescript
components: [
  // Layout components - prefix 'Layout'
  { path: '~/components/layouts', prefix: 'Layout', global: false },

  // Composition components - prefix 'Composition'
  { path: '~/components/compositions', prefix: 'Composition', global: false },

  // UI components - NO prefix (for convenience)
  { path: '~/components/ui', prefix: '', global: true },

  // Feature components - prefix 'Feature'
  { path: '~/components/features', prefix: 'Feature', global: false }
]
```

## Naming Conventions

### Layout Components
- Generic structure names: `AppLayout`, `AdminLayout`, `AuthLayout`
- Describe the overall page structure

### UI Components
- Generic element names: `Button`, `Card`, `Modal`, `Input`
- Reusable across the entire application
- No domain-specific prefixes

### Composition Components
- Describe the composition: `TwoPaneLayout`, `DiscoverPageLayout`
- Combine multiple UI components
- Often layout-specific

### Feature Components
- Feature-prefixed: `Dashboard*`, `Folder*`, `Permission*`
- Domain-specific logic
- Feature-focused

## Common Mistakes & Fixes

### ❌ Mistake 1: Using `<DashboardCard>` Instead of `<FeatureDashboardCard>`

```vue
<!-- ❌ WRONG -->
<template>
  <DashboardCard />
</template>

<!-- Error: [Vue warn]: Failed to resolve component: DashboardCard -->
```

```vue
<!-- ✅ CORRECT -->
<template>
  <FeatureDashboardCard />
</template>
```

**Solution:** Check `.nuxt/components.d.ts` for correct component names

### ❌ Mistake 2: Manual Imports Conflicting with Auto-Import

```vue
<!-- ❌ WRONG - mixing manual imports with auto-import -->
<script setup>
import DashboardCard from '~/components/features/DashboardCard.vue'
</script>

<template>
  <DashboardCard />  <!-- Won't match auto-imported name -->
</template>
```

```vue
<!-- ✅ CORRECT - use auto-import only -->
<script setup>
// No imports needed
</script>

<template>
  <FeatureDashboardCard />
</template>
```

## Debugging Component Resolution

### Step 1: Check Auto-Import Registration

```bash
# Check the generated types file
cat .nuxt/components.d.ts | grep FeatureDashboard
```

Expected output:
```typescript
export const FeatureDashboardCard: typeof import("../components/features/DashboardCard.vue")['default']
```

### Step 2: Clear Cache and Rebuild

```bash
rm -rf .nuxt node_modules/.vite
npm run dev
```

### Step 3: Check Browser Console

Open DevTools (F12) → Console

Look for errors like:
```
[Vue warn]: Failed to resolve component: DashboardCard
```

## Creating New Components

### Adding a New Feature Component

1. Create file: `app/components/features/MyNewFeature.vue`

```vue
<template>
  <div class="my-feature">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Feature logic here
</script>

<style scoped>
/* Use CSS variables, not hardcoded colors */
.my-feature {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
}
</style>
```

2. Use in pages: `<FeatureMyNewFeature />`

### Adding a New UI Component

1. Create file: `app/components/ui/MyButton.vue`
2. Use anywhere: `<MyButton />` (no prefix needed)

### Adding a New Layout Component

1. Create file: `app/components/layouts/MyLayout.vue`
2. Use: `<LayoutMyLayout />`

## Best Practices

### ✅ DO

1. **Use folder structure for organization**
   ```
   app/components/
     ├── layouts/      (Layout components)
     ├── compositions/ (Composition components)
     ├── ui/           (UI elements)
     └── features/     (Feature components)
   ```

2. **Keep component names clear and descriptive**
   ```
   ✅ AppLayout.vue
   ✅ DashboardCard.vue
   ✅ FolderSidebar.vue
   ```

3. **Use CSS variables, not hardcoded colors**
   ```css
   ✅ color: var(--color-primary);
   ✅ padding: var(--spacing-lg);
   ❌ color: #2d3389;
   ❌ padding: 24px;
   ```

4. **Check `.nuxt/components.d.ts` when unsure**
   ```bash
   cat .nuxt/components.d.ts | grep YourComponent
   ```

5. **Clear cache after changing nuxt.config.ts**
   ```bash
   rm -rf .nuxt node_modules/.vite && npm run dev
   ```

### ❌ DON'T

1. **Don't mix import styles**
   ```typescript
   // ❌ Don't do this
   import Component from './Component.vue'
   // ✅ Just use auto-import
   ```

2. **Don't ignore folder structure**
   ```
   ❌ app/components/DashboardCard.vue (not in features folder)
   ✅ app/components/features/DashboardCard.vue
   ```

3. **Don't use ambiguous names**
   ```
   ❌ Card.vue (could be UI or feature)
   ✅ DashboardCard.vue (clearly feature-specific)
   ```

4. **Don't hardcode colors**
   ```css
   ❌ background: #ffffff;
   ✅ background: var(--color-bg-primary);
   ```

## Component Lifecycle Best Practices

### Initialization Order

1. **Define props and emits** - Document component interface
2. **Setup logic** - Initialize state and composables
3. **Computed properties** - Derive data from state
4. **Watchers** - React to state changes
5. **Lifecycle hooks** - Mount, update, unmount logic

### Example:

```vue
<script setup lang="ts">
// 1. Props and emits
interface Props {
  title: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  action: []
}>()

// 2. State
const isOpen = ref(false)

// 3. Computed
const displayTitle = computed(() => props.title.toUpperCase())

// 4. Watchers
watch(() => props.loading, (newValue) => {
  if (!newValue) isOpen.value = false
})

// 5. Methods
const handleAction = () => {
  emit('action')
}

// 6. Lifecycle
onMounted(() => {
  console.log('Component mounted')
})
</script>
```

## File Organization Example

```
app/components/
├── layouts/
│   ├── AppLayout.vue          # Main page layout
│   ├── AdminLayout.vue        # Admin panel layout
│   └── AuthLayout.vue         # Auth page layout
│
├── compositions/
│   ├── TwoPaneLayout.vue      # Generic two-pane pattern
│   ├── DiscoverPageLayout.vue # Dashboard discovery layout
│   └── AdminPanelLayout.vue   # Admin panel composition
│
├── ui/
│   ├── Button.vue             # Button element
│   ├── Card.vue               # Card container
│   ├── Modal.vue              # Modal dialog
│   ├── Input.vue              # Input field
│   ├── Breadcrumb.vue         # Breadcrumb navigation
│   ├── Badge.vue              # Badge element
│   ├── AppHeader.vue          # App header
│   ├── AppFooter.vue          # App footer
│   └── AdminHeader.vue        # Admin header
│
└── features/
    ├── DashboardCard.vue      # Dashboard card component
    ├── DashboardGrid.vue      # Dashboard grid layout
    ├── DashboardViewHeader.vue # Dashboard view header
    ├── DashboardHeader.vue    # Dashboard header
    ├── FolderSidebar.vue      # Folder navigation sidebar
    ├── FolderTree.vue         # Folder tree component
    ├── FolderInfoCard.vue     # Folder info display
    ├── QuickShareDialog.vue   # Quick share dialog
    └── PermissionEditor.vue   # Permission editor component
```

## References

- [Nuxt Auto-Import Documentation](https://nuxt.com/docs/guide/concepts/auto-imports)
- [Component Discovery](https://nuxt.com/docs/guide/directory-structure/components)
- [Design System](./DESIGN_SYSTEM.md)
- [Layout Components](./LAYOUT_COMPONENTS.md)

---

**Last Updated:** 2026-02-10
**Status:** Active - All teams must follow this convention
