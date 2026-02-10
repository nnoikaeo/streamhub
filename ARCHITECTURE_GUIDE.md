# 🏗️ StreamHub Component Architecture Guide

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

## 📁 Directory Structure

```
components/
├── layouts/              # 1. Layout Components (Foundation)
│   ├── AppLayout.vue
│   ├── AuthLayout.vue
│   └── DashboardLayout.vue
│
├── compositions/         # 2. Composition Components (Reusable Sections)
│   ├── DashboardHeader.vue
│   ├── FolderSidebar.vue
│   ├── DiscoverPageLayout.vue
│   └── TwoPaneLayout.vue
│
├── ui/                   # 3. UI Components (Building Blocks)
│   ├── Button.vue
│   ├── Card.vue
│   ├── Modal.vue
│   ├── Breadcrumb.vue
│   ├── Input.vue
│   └── Badge.vue
│
└── features/             # 4. Feature Components (Page-Specific)
    ├── DashboardCard.vue
    ├── DashboardGrid.vue
    ├── FolderTree.vue
    ├── FolderInfoCard.vue
    └── QuickShareDialog.vue
```

---

## 🎨 CSS Architecture - Single Source of Truth

### **Problem: Scoped Styles Override Global Styles**

**Issue:**
```vue
<!-- Component with scoped styles -->
<template>
  <h1 class="brand-logo">StreamHub</h1>
</template>

<style scoped>
.brand-logo {
  color: #212121; /* ❌ Overrides global primary color */
}
</style>
```

**Result:** Global CSS ใน `main.css` ไม่มีผล เพราะ scoped styles มี specificity สูงกว่า

---

### **Solution: Global CSS with !important**

**Strategy:**
1. ใช้ `!important` ใน global styles
2. ลบ color declarations จาก component scoped styles
3. Components ใช้เฉพาะ layout/spacing styles

**Implementation:**

#### ✅ `assets/css/main.css` (Global - Single Source of Truth)
```css
/* Global heading styles - Override ALL scoped styles */
h1, h2, h3, h4, h5, h6 {
  color: var(--color-primary) !important;
  font-weight: 600;
}

/* Specific class overrides */
.brand-logo,
.sidebar-title,
.dashboards-count {
  color: var(--color-primary) !important;
}
```

#### ✅ Component Styles (Layout/Spacing Only)
```vue
<template>
  <h1 class="brand-logo">StreamHub</h1>
</template>

<style scoped>
.brand-logo {
  /* ✅ Layout & Spacing only */
  font-size: 1.5rem;
  margin: 0;
  padding: 0.5rem 0;
  
  /* ❌ NO color declarations */
  /* color: #212121; <- Remove this */
}
</style>
```

---

## 🏗️ Architecture Layers

### Layer 1: Layout Components (Foundation)

**Purpose:** Define overall page structure  
**Responsibility:** Grid layout, header/footer placement, navigation structure  
**Example:** `AppLayout.vue`, `DashboardLayout.vue`

```vue
<!-- AppLayout.vue -->
<template>
  <div class="app-layout">
    <DashboardHeader />
    <div class="app-content">
      <slot />
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
/* ✅ Structure only - no colors */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
}
</style>
```

**Rules:**
- ❌ NO color/theme styles
- ✅ Structure, layout, positioning only
- ✅ Used by ALL pages

---

### Layer 2: Composition Components (Reusable Sections)

**Purpose:** Reusable page sections  
**Responsibility:** Combine UI components into functional sections  
**Example:** `DiscoverPageLayout.vue`, `TwoPaneLayout.vue`

```vue
<!-- DiscoverPageLayout.vue -->
<template>
  <AppLayout>
    <Breadcrumb :items="breadcrumbItems" />
    <TwoPaneLayout>
      <template #sidebar>
        <slot name="sidebar" />
      </template>
      <div class="main-content">
        <slot />
      </div>
    </TwoPaneLayout>
  </AppLayout>
</template>

<style scoped>
/* ✅ Layout only */
.main-content {
  padding: var(--spacing-lg);
  overflow-y: auto;
}
</style>
```

**Rules:**
- ❌ NO hardcoded colors
- ✅ Use CSS variables only
- ✅ Combine multiple UI components
- ✅ Reusable across pages

---

### Layer 3: UI Components (Building Blocks)

**Purpose:** Generic, reusable UI elements  
**Responsibility:** Basic styling, props for variants  
**Example:** `Button.vue`, `Card.vue`, `Modal.vue`

```vue
<!-- Button.vue -->
<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary' // primary | secondary | ghost
  }
})

const buttonClass = computed(() => `theme-btn theme-btn--${props.variant}`)
</script>

<style>
/* ❌ NO scoped styles for UI components */
/* Use global theme.css instead */
</style>
```

**Implementation in `theme.css`:**
```css
.theme-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.theme-btn--primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.theme-btn--primary:hover {
  background-color: var(--color-primary-dark);
}
```

**Rules:**
- ❌ NO scoped styles
- ✅ Use global `.theme-*` classes
- ✅ Configurable via props
- ✅ Used across entire app

---

### Layer 4: Feature Components (Page-Specific)

**Purpose:** Business logic for specific features  
**Responsibility:** Feature-specific behavior, data handling  
**Example:** `DashboardCard.vue`, `QuickShareDialog.vue`

```vue
<!-- DashboardCard.vue -->
<template>
  <Card>
    <h3 class="card-title">{{ dashboard.name }}</h3>
    <div class="card-meta">
      <Badge>{{ dashboardType }}</Badge>
      <span>{{ permissions }}</span>
    </div>
    <Button variant="primary" @click="$emit('view')">
      Open
    </Button>
  </Card>
</template>

<style scoped>
/* ✅ Feature-specific layout only */
.card-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin: var(--spacing-md) 0;
}

/* ❌ NO color overrides */
/* card-title color comes from global main.css */
</style>
```

**Rules:**
- ✅ Use UI components as building blocks
- ✅ Feature-specific layouts only
- ❌ NO theme color overrides
- ✅ Colors inherit from global CSS

---

## 🎨 Styling Rules Summary

### ✅ DO (Best Practices)

**1. Global Styles (`main.css`, `theme.css`)**
```css
/* Define colors ONCE */
h1, h2, h3 {
  color: var(--color-primary) !important;
}

.theme-btn--primary {
  background-color: var(--color-primary);
}
```

**2. Component Styles (Scoped)**
```vue
<style scoped>
/* Layout & spacing only */
.my-component {
  display: flex;
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
}
</style>
```

**3. Use CSS Variables**
```css
/* ✅ Always use variables */
.my-class {
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border-color: var(--color-border-light);
}
```

---

### ❌ DON'T (Anti-patterns)

**1. Hardcoded Colors in Components**
```vue
<style scoped>
/* ❌ WRONG - Hardcoded color */
.brand-logo {
  color: #212121;
}

/* ✅ CORRECT - Let global CSS handle it */
.brand-logo {
  /* No color declaration */
  font-size: 1.5rem;
}
</style>
```

**2. Duplicate Color Definitions**
```css
/* ❌ WRONG - Color defined in multiple places */
/* In Component A */
.title { color: #2d3389; }

/* In Component B */
.heading { color: #2d3389; }

/* ✅ CORRECT - Define once globally */
h1, h2, h3, .title, .heading {
  color: var(--color-primary) !important;
}
```

**3. Override Global Styles Locally**
```vue
<style scoped>
/* ❌ WRONG - Fighting with global styles */
h1 {
  color: #000000 !important;
}
</style>
```

---

## 📊 Decision Tree: Where to Put Styles?

```
Question: What am I styling?

├─ Is it a COLOR, THEME, or TYPOGRAPHY?
│  └─ YES → Put in `main.css` or `theme.css`
│
├─ Is it LAYOUT, SPACING, or POSITIONING?
│  └─ YES → Component scoped styles
│
├─ Is it a REUSABLE UI PATTERN?
│  └─ YES → Create `.theme-*` class in `theme.css`
│
└─ Is it FEATURE-SPECIFIC behavior?
   └─ YES → Component scoped styles (layout only)
```

---

## 🔧 Migration Checklist

### Step 1: Audit Existing Components

```bash
# Find components with color definitions
grep -r "color:" components/ --include="*.vue"

# Find hardcoded hex colors
grep -r "#[0-9a-f]\{6\}" components/ --include="*.vue"
```

### Step 2: Remove Color from Scoped Styles

**Before:**
```vue
<style scoped>
.card-title {
  color: #111827;        /* ❌ Remove */
  font-size: 1.125rem;   /* ✅ Keep */
  margin: 0;             /* ✅ Keep */
}
</style>
```

**After:**
```vue
<style scoped>
.card-title {
  /* color removed - inherits from global */
  font-size: 1.125rem;
  margin: 0;
}
</style>
```

### Step 3: Add Global Overrides (if needed)

If component doesn't inherit colors correctly:

```css
/* main.css */
.card-title {
  color: var(--color-primary) !important;
}
```

### Step 4: Test All Pages

- [ ] Check all h1, h2, h3, h4, h5, h6 are primary color
- [ ] Check all buttons use primary color
- [ ] Check card titles use primary color
- [ ] Test hover states
- [ ] Test responsive design

---

## 🎯 Current Architecture Status

### ✅ Completed
- [x] Global CSS variables defined (`main.css`)
- [x] Theme component classes created (`theme.css`)
- [x] Layout components structure (`layouts/`)
- [x] Composition components structure (`compositions/`)
- [x] UI components structure (`ui/`)
- [x] Feature components structure (`features/`)

### 🔄 In Progress
- [ ] Remove color overrides from all components
- [ ] Add global heading styles with !important
- [ ] Standardize button styling

### 📋 Next Steps
1. Replace `main.css` with global override version
2. Audit all components for color definitions
3. Remove scoped color styles
4. Test across all pages

---

## 💡 Key Insights

### Why !important is OK Here

**Usually:** `!important` is considered bad practice

**In this case:** It's the **correct solution** because:
1. ✅ Global styles should override component styles for theme consistency
2. ✅ Prevents components from breaking theme
3. ✅ Single source of truth for colors
4. ✅ Components focus on layout, not theme

### Component Responsibility

| Layer | Responsibility | Styling Scope |
|-------|---------------|---------------|
| Layout | Page structure | Grid, flex, positioning |
| Composition | Section assembly | Spacing between components |
| UI | Reusable patterns | Global `.theme-*` classes |
| Feature | Business logic | Feature-specific layout |

**All layers:** ❌ NO color definitions (use global CSS)

---

## 🚀 Quick Fix Guide

### Problem: Headers not using Primary color

**Root Cause:** Vue scoped styles override global CSS

**Solution:**
```bash
# 1. Replace main.css with global override version
cp main-global.css assets/css/main.css

# 2. Clear cache
rm -rf .nuxt

# 3. Restart
npm run dev
```

**Expected Result:**
- ✅ All h1, h2, h3, h4, h5, h6 → Primary color
- ✅ "StreamHub" logo → Primary color
- ✅ "FOLDERS" heading → Primary color
- ✅ "1 Dashboards Found" → Primary color
- ✅ Card titles → Primary color

---

## 📚 Documentation References

### Component & Design System
- **[Component Conventions](docs/COMPONENT_CONVENTIONS.md)** - Component auto-import, naming conventions, organization
- **[Design System](docs/DESIGN_SYSTEM.md)** - Design tokens, CSS variables, styling guidelines
- **[Layout Components](docs/LAYOUT_COMPONENTS.md)** - Layout structure, composition patterns, responsive design

### Page Architecture & State Management
- **[Strategy 4: Hybrid Approach](docs/STRATEGY_4_HYBRID_APPROACH.md)** - **Recommended architecture** for page reusability using Pinia stores + composables
  - How to structure reusable pages
  - Pinia store management
  - Composable logic extraction
  - Permission integration
  - Real-world examples and patterns

- **[Permissions Store](docs/PERMISSIONS_STORE.md)** - Role-based access control (RBAC) with Pinia
  - User permissions and roles
  - Permission checking at multiple levels
  - Integration with UI components
  - Practical implementation examples
  - Testing strategies

---

## 📝 Summary

**Architecture Principles:**
1. **Separation of Concerns** - Layout vs Theme vs Logic
2. **Single Source of Truth** - Colors in global CSS only
3. **Component Hierarchy** - Layout → Composition → UI → Feature
4. **CSS Variables** - Use `var(--color-*)` everywhere
5. **Global Override** - Use `!important` for theme consistency

**Result:**
- 🎨 Change primary color in ONE place → affects entire app
- 🔧 Easy to maintain and update
- 📦 Components are reusable and theme-agnostic
- ✅ Follows best practices for Vue/Nuxt applications

---

Generated by Claude | StreamHub Architecture Guide
