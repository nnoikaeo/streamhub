# Layout Components Documentation

## Overview

Layout components form the structural foundation of StreamHub. They manage the overall page structure, navigation, and responsive behavior.

**Key Layout Components:**
- **AppLayout** - Standard application layout
- **AdminLayout** - Admin panel layout
- **AuthLayout** - Authentication page layout (to be created)
- **TwoPaneLayout** - Generic two-pane composition
- **DiscoverPageLayout** - Dashboard discovery layout
- **AdminPanelLayout** - Admin panel composition

## AppLayout Component

**File:** `app/components/layouts/AppLayout.vue`

### Purpose

Provides the consistent, full-page layout structure with header and footer. Manages responsive behavior for all main application pages.

### Props

```typescript
interface Props {
  // Optional: showSidebar for future multi-layout support
  showSidebar?: boolean
}
```

### Structure

```
┌─────────────────────────────┐
│      <AppHeader>            │ Fixed header
├─────────────────────────────┤
│                             │
│    <slot> (Page Content)    │ Scrollable
│                             │
├─────────────────────────────┤
│      <AppFooter>            │ Fixed footer
└─────────────────────────────┘
```

### Usage Example

```vue
<template>
  <LayoutAppLayout>
    <PageHeader title="Dashboard" icon="📊" />

    <div class="page-content">
      <div class="container">
        <!-- Your page content -->
      </div>
    </div>
  </LayoutAppLayout>
</template>
```

## TwoPaneLayout Component

**File:** `app/components/compositions/TwoPaneLayout.vue`

### Purpose

Generic two-pane layout pattern combining a fixed sidebar with scrollable main content. Reusable across multiple pages.

### Props

```typescript
interface Props {
  /** Sidebar width in pixels (default: 280) */
  sidebarWidth?: number

  /** Show/hide sidebar (default: true) */
  showSidebar?: boolean

  /** Sidebar background color (default: #f9fafb) */
  sidebarBg?: string

  /** Main content background color (default: #ffffff) */
  mainBg?: string
}
```

### Slots

```typescript
/** Sidebar content */
#sidebar: () => VNode[]

/** Main content area (default slot) */
default: () => VNode[]
```

### Structure

```
┌──────────────┬─────────────────────┐
│              │                     │
│   Sidebar    │   Main Content      │
│  (Fixed)     │   (Scrollable)      │
│              │                     │
│              │                     │
└──────────────┴─────────────────────┘
```

### Usage Example

```vue
<template>
  <CompositionTwoPaneLayout :sidebar-width="280">
    <template #sidebar>
      <FeatureFolderSidebar />
    </template>

    <FeatureDashboardGrid />
  </CompositionTwoPaneLayout>
</template>
```

## DiscoverPageLayout Component

**File:** `app/components/compositions/DiscoverPageLayout.vue`

### Purpose

Specialized composition combining AppLayout with TwoPaneLayout for the dashboard discovery page.

### Structure

```
┌──────────────────────────────────┐
│        <AppLayout>               │
│ ┌────────────┬──────────────────┐│
│ │            │                  ││
│ │ TwoPaneLayout (Folder | Grid) ││
│ │            │                  ││
│ └────────────┴──────────────────┘│
└──────────────────────────────────┘
```

### Usage Example

```vue
<template>
  <CompositionDiscoverPageLayout>
    <template #sidebar>
      <FeatureFolderSidebar
        :folders="rootFolders"
        :selected-folder-id="selectedFolderId"
        @select-folder="handleFolderSelect"
      />
    </template>

    <FeatureDashboardGrid :dashboards="dashboards" />
  </CompositionDiscoverPageLayout>
</template>
```

## AdminLayout Component

**File:** `app/components/layouts/AdminLayout.vue`

### Purpose

Layout for admin panel pages with a dark header and sidebar navigation.

### Structure

```
┌─────────────────────────────┐
│   <AdminHeader> (Dark)      │ Fixed
├────────────┬────────────────┤
│            │                │
│  Sidebar   │  Main Content  │
│            │                │
└────────────┴────────────────┘
```

### Notes

- Desktop-only (Phase 1)
- Dark theme header (#1f2937)
- Requires responsive redesign for mobile (Phase 2)

## AuthLayout Component (To Be Created)

**File:** `app/components/layouts/AuthLayout.vue` (future)

### Purpose

Simple centered layout for authentication pages (login, register, forgot password).

### Proposed Structure

```
         ┌──────────────────┐
         │                  │
    ┌────┤   Auth Form      │────┐
    │    │   (Centered)     │    │
    │    │                  │    │
    │    └──────────────────┘    │
    └──────────────────────────────┘
```

### Example Implementation

```vue
<template>
  <LayoutAuthLayout>
    <div class="auth-form">
      <h1>Login</h1>
      <form>
        <!-- Form fields -->
      </form>
    </div>
  </LayoutAuthLayout>
</template>

<style scoped>
.auth-form {
  max-width: 28rem;
}
</style>
```

## AdminPanelLayout Component

**File:** `app/components/compositions/AdminPanelLayout.vue`

### Purpose

Combines AdminLayout with TwoPaneLayout for admin pages.

### Usage Example

```vue
<template>
  <CompositionAdminPanelLayout>
    <template #sidebar>
      <!-- Admin navigation -->
    </template>

    <!-- Admin content -->
  </CompositionAdminPanelLayout>
</template>
```

## Layout Best Practices

### DO ✅

1. **Use layouts for all pages**
   ```vue
   <!-- ✅ CORRECT -->
   <template>
     <LayoutAppLayout>
       <PageHeader title="Dashboard" />
       <!-- Content -->
     </LayoutAppLayout>
   </template>
   ```

2. **Pass only necessary props**
   ```vue
   <!-- ✅ Good - only required props -->
   <LayoutAppLayout>
     <PageHeader title="Dashboard" />
   </LayoutAppLayout>
   ```

3. **Use composition layouts for common patterns**
   ```vue
   <!-- ✅ CORRECT -->
   <template>
     <CompositionDiscoverPageLayout>
       <template #sidebar>...</template>
       <MainContent />
     </CompositionDiscoverPageLayout>
   </template>
   ```

4. **Maintain responsive design**
   - TwoPaneLayout adapts to mobile
   - AppLayout works on all devices
   - Components use mobile-first CSS

### DON'T ❌

1. **Don't create layout HTML directly in pages**
   ```vue
   <!-- ❌ WRONG - HTML structure in page -->
   <template>
     <div class="flex h-screen">
       <header>...</header>
       <main>...</main>
       <footer>...</footer>
     </div>
   </template>

   <!-- ✅ CORRECT - Use layout component -->
   <template>
     <LayoutAppLayout>
       <!-- Just content -->
     </LayoutAppLayout>
   </template>
   ```

2. **Don't duplicate layout structure**
   - Use composition layouts for common patterns
   - Don't build similar structures multiple times

3. **Don't override layout styling in pages**
   - Layouts define structure
   - Use CSS variables for consistency
   - Avoid scoped style overrides

## Common Layout Patterns

### Standard Page Layout

```vue
<template>
  <LayoutAppLayout>
    <!-- Breadcrumbs (optional) -->
    <nav class="breadcrumbs">
      <!-- Breadcrumb items -->
    </nav>

    <!-- Page Header with Actions -->
    <PageHeader
      title="Page Title"
      subtitle="Description"
      action-label="Create"
      @action-click="handleCreate"
    />

    <!-- Page Content -->
    <div class="page-container">
      <!-- Your content -->
    </div>
  </LayoutAppLayout>
</template>
```

### Two-Pane Page Layout

```vue
<template>
  <CompositionDiscoverPageLayout>
    <template #sidebar>
      <!-- Navigation sidebar -->
      <FeatureFolderSidebar />
    </template>

    <!-- Main content area -->
    <FeatureDashboardGrid />
  </CompositionDiscoverPageLayout>
</template>
```

### Admin Page Layout

```vue
<template>
  <CompositionAdminPanelLayout>
    <template #sidebar>
      <!-- Admin navigation -->
    </template>

    <!-- Admin content -->
    <PageHeader title="Admin Section" />
    <FeaturePermissionEditor />
  </CompositionAdminPanelLayout>
</template>
```

## Responsive Design

All layouts support responsive behavior:

### Desktop (lg: 1024px+)
- Two-pane layout shows sidebar
- Full navigation visible
- Optimal spacing and sizing

### Tablet (md: 768px - 1023px)
- Sidebar width reduced
- Responsive grid layout
- Touch-friendly spacing

### Mobile (< 768px)
- Sidebar hidden or drawer
- Single column layout
- Simplified navigation
- Full-width content

## Performance Considerations

1. **Avoid nested layouts** - Use composition layouts instead
2. **Lazy load content** - Use Suspense/lazy components
3. **Optimize sidebar rendering** - Reduce DOM nodes in sidebars
4. **Cache layout state** - Persist sidebar/menu state to localStorage

## Testing Layouts

### Desktop Testing
```bash
# Open browser DevTools
# Set viewport to 1920x1080
# Test two-pane layout
```

### Responsive Testing
```bash
# DevTools → Toggle device toolbar
# Test at 768px, 1024px, 375px widths
# Verify sidebar behavior
# Check spacing consistency
```

### Accessibility Testing
```bash
# Tab navigation works
# Focus visible on interactive elements
# Heading hierarchy is correct
# Color contrast meets WCAG AA
```

## References

- [Component Conventions](./COMPONENT_CONVENTIONS.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Architecture Guide](../ARCHITECTURE_GUIDE.md)

---

**Last Updated:** 2026-02-10
**Status:** Active Development
**Maintained By:** Development Team
