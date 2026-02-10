# StreamHub Design System

## Overview

The StreamHub design system is a comprehensive collection of design tokens, components, and guidelines that ensure consistency and maintainability across the application.

**Key Principles:**
- **Design Tokens** - Centralized CSS custom properties for colors, typography, spacing, etc.
- **Component Library** - Reusable Vue 3 components following design system principles
- **Accessibility** - WCAG AA compliance standards
- **Responsive Design** - Mobile-first approach
- **Maintainability** - Single source of truth for all styling

## Design Tokens System

### What Are Design Tokens?

Design tokens are **reusable design values** stored as CSS custom properties (variables). They define the visual language of the application and make theming, maintenance, and updates easier.

**Token Location:** `assets/css/main.css`

### Token Categories

#### 1. Semantic Colors

Express **meaning** rather than implementation:

```css
/* Primary Brand Color */
--color-primary: #2d3389
--color-primary-dark: #1f2461
--color-primary-light: #5d7eb8
--color-primary-lighter: #8fa6d0
--color-primary-lightest: #e0e5f3

/* Status Colors */
--color-success: #10b981
--color-warning: #f59e0b
--color-error: #ef4444
--color-info: #3b82f6

/* Semantic Colors */
--color-text-primary       /* Main text */
--color-text-secondary     /* Secondary text */
--color-text-disabled      /* Disabled text */
--color-text-inverse       /* Inverse text (white) */

--color-bg-primary         /* Main backgrounds */
--color-bg-secondary       /* Secondary backgrounds */
--color-bg-tertiary        /* Tertiary backgrounds */

--color-border-light       /* Light borders */
--color-border-default     /* Default borders */
--color-border-dark        /* Dark borders */

/* Neutral Colors - 10 shades (50-900) */
--color-neutral-50 to --color-neutral-900
```

**Usage Pattern:**
```css
.button {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-border-default);
}

.button:hover {
  background-color: var(--color-primary-dark);
}
```

#### 2. Spacing Scale

Base unit: **4px** (represented as `--spacing-1`)

```css
--spacing-xs: 0.25rem    (4px)
--spacing-sm: 0.5rem     (8px)
--spacing-md: 1rem       (16px)
--spacing-lg: 1.5rem     (24px)
--spacing-xl: 2rem       (32px)
--spacing-2xl: 3rem      (48px)
```

**Usage:**
```css
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}
```

#### 3. Border Radius

Rounded corner system:

```css
--radius-sm: 0.375rem    (6px)   /* subtle rounding */
--radius-md: 0.5rem      (8px)   /* standard */
--radius-lg: 0.75rem     (12px)  /* pronounced */
```

**Usage Pattern:**
```css
.card { border-radius: var(--radius-lg); }
.button { border-radius: var(--radius-md); }
.avatar { border-radius: 9999px; /* Full circle */ }
```

#### 4. Shadows

Represent **visual hierarchy** through elevation:

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

**Elevation Pattern:**
```css
.card { box-shadow: var(--shadow-sm); }
.card:hover { box-shadow: var(--shadow-md); }
.modal { box-shadow: var(--shadow-lg); }
```

#### 5. Transitions

Consistent motion and timing:

```css
--transition-fast: 150ms ease-in-out   /* Quick feedback */
--transition-base: 300ms ease-in-out   /* Default */
--transition-slow: 500ms ease-in-out   /* Subtle */
```

**Usage:**
```css
.interactive-element {
  transition: var(--transition-base);
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

## Design Principles

### 1. Use CSS Variables Everywhere

**Don't:**
```css
.button {
  background-color: #2d3389;        /* Hardcoded */
  padding: 12px 24px;               /* Hardcoded */
  border-radius: 8px;               /* Hardcoded */
}
```

**Do:**
```css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
}
```

### 2. Semantic Meaning Over Implementation

**Don't:**
```css
.error-message {
  color: #ef4444;  /* Why this color? Purpose unclear */
}
```

**Do:**
```css
.error-message {
  color: var(--color-error);  /* Clear intent */
}
```

### 3. Responsive Design (Mobile-First)

```css
/* Mobile (default) */
.grid {
  grid-template-columns: 1fr;
}

/* Tablet (md: 768px) */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (lg: 1024px) */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 4. Accessibility First

Ensure proper **contrast and clarity**:

- Text Contrast: Minimum 4.5:1 ratio for normal text
- Large Text: Minimum 3:1 ratio for large text (18pt+)
- Interactive Elements: Clearly distinguishable focus states

```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.error-text {
  color: var(--color-error);
}

.error-text::before {
  content: '⚠ ';    /* Icon in addition to color */
}
```

### 5. Consistency is Key

All colors, spacing, and sizing should come from the design token system. This ensures:

- ✅ Unified visual language
- ✅ Easy maintenance
- ✅ Simple theme changes
- ✅ Better team collaboration

## Common Styling Patterns

### Card Pattern

```vue
<template>
  <Card>
    <h3>Title</h3>
    <p>Content</p>
  </Card>
</template>

<style scoped>
/* Define in theme.css or component */
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-default);
}
</style>
```

### Button Pattern

```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.button--primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.button--primary:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
}
```

### Input Pattern

```css
.input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 51, 137, 0.1);
}
```

## File Structure

```
assets/css/
├── main.css       # Design tokens and base styles
└── theme.css      # Component-specific styles
```

### main.css Contents
- CSS custom properties (design tokens)
- Base element styles (h1-h6, body, etc.)
- Global utility classes

### theme.css Contents
- Component class definitions (.theme-card, .theme-button)
- Component variants
- Responsive overrides

## Migration Checklist

### Step 1: Audit Existing Code

```bash
# Find hardcoded colors
grep -r "#[0-9a-fA-F]\{6\}" app/components/ --include="*.vue"

# Find hardcoded spacing values
grep -r "padding:\|margin:\|gap:" app/components/ --include="*.vue" | grep -E "[0-9]+(px|rem|em)"
```

### Step 2: Replace with Variables

**Before:**
```css
.card-title {
  color: #2d3389;           /* ❌ Remove */
  font-size: 1.125rem;      /* ✅ Keep (typography) */
  margin-bottom: 16px;      /* ⚠️ Convert to var(--spacing-md) */
  padding: 0;               /* ✅ Keep */
}
```

**After:**
```css
.card-title {
  color: var(--color-primary);
  font-size: 1.125rem;
  margin-bottom: var(--spacing-md);
  padding: 0;
}
```

### Step 3: Test Thoroughly

- [ ] All colors display correctly
- [ ] Spacing is consistent
- [ ] Responsive behavior works
- [ ] Hover states display correctly
- [ ] Accessibility is maintained

## Best Practices

### DO

✅ Use design tokens for all colors
✅ Use variables for spacing and sizing
✅ Maintain responsive mobile-first approach
✅ Test color contrast for accessibility
✅ Document custom styling in comments
✅ Keep styling DRY using classes
✅ Use CSS specificity appropriately

### DON'T

❌ Hardcode colors directly
❌ Use arbitrary spacing values
❌ Mix token and hardcoded values
❌ Override global styles unnecessarily
❌ Use !important excessively
❌ Duplicate style definitions
❌ Ignore mobile responsiveness

## Resources

- [Design Tokens Reference](../assets/css/main.css)
- [Component Conventions](./COMPONENT_CONVENTIONS.md)
- [Layout Components](./LAYOUT_COMPONENTS.md)

---

**Last Updated:** 2026-02-10
**Version:** 1.0
**Maintained By:** Development Team
