# StreamHub Design System

## 📋 Overview

StreamHub uses a **centralized design system** to ensure consistency across all pages and components. This document outlines the theme configuration, color palette, and component styling guidelines.

**Key Principle:** Change theme values in ONE place, and the entire application updates automatically.

---

## 🎨 Color Palette

### Primary Brand Color
- **Primary:** `#2d3389` (Navy Blue)
- **Primary Dark:** `#1f2461`
- **Primary Light:** `#5d7eb8`
- **Primary Lighter:** `#8fa6d0`
- **Primary Lightest:** `#e0e5f3`

### Secondary Color
- **Secondary:** `#ffffff` (White)
- **Secondary Light:** `#fafafa`
- **Secondary Lighter:** `#f5f5f5`

### Neutral Grays
- **50:** `#fafafa`
- **100:** `#f5f5f5`
- **200:** `#eeeeee`
- **300:** `#e0e0e0`
- **400:** `#bdbdbd`
- **500:** `#9e9e9e`
- **600:** `#757575`
- **700:** `#616161`
- **800:** `#424242`
- **900:** `#212121`

### Status Colors
- **Success:** `#10b981`
- **Warning:** `#f59e0b`
- **Error:** `#ef4444`
- **Info:** `#3b82f6`

---

## 🎯 CSS Variables

All colors are available as CSS variables in `:root`. Use these in your custom styles:

```css
/* Color Variables */
--color-primary: #2d3389;
--color-primary-dark: #1f2461;
--color-text-primary: #212121;
--color-text-secondary: #757575;
--color-bg-primary: #ffffff;
--color-bg-secondary: #fafafa;
--color-border-light: #eeeeee;

/* Spacing Variables */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 3rem;

/* Shadow Variables */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Radius Variables */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;

/* Transition Variables */
--transition-fast: 150ms ease-in-out;
--transition-base: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

**Example Usage:**
```css
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
```

---

## 🧩 Tailwind Configuration

The project uses Tailwind CSS with custom theme extensions in `tailwind.config.ts`.

### Using Custom Colors in Templates

```html
<!-- Primary Colors -->
<button class="bg-primary-500 text-white">Primary Button</button>
<div class="bg-primary-100 text-primary-700">Primary Container</div>

<!-- Neutral Colors -->
<div class="bg-neutral-100 text-neutral-900">Neutral Container</div>

<!-- Status Colors -->
<div class="bg-green-100 text-green-700">Success Alert</div>
```

---

## 🎨 Component Styles

All reusable component styles are defined in `assets/css/theme.css`. Use these classes in your Vue components:

### Header Styles
```html
<header class="page-header">
  <h1 class="page-header__title">Page Title</h1>
  <p class="page-header__subtitle">Optional subtitle</p>
</header>
```

### Card Styles
```html
<div class="theme-card">
  <div class="theme-card__header">
    <h2 class="theme-card__title">Card Title</h2>
  </div>
  <div class="theme-card__content">
    Card content goes here...
  </div>
</div>

<!-- Card with left accent -->
<div class="theme-card theme-card--primary">
  Content...
</div>
```

### Button Styles
```html
<!-- Primary Button -->
<button class="theme-btn theme-btn--primary">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="theme-btn theme-btn--secondary">
  Secondary Action
</button>

<!-- Ghost Button (transparent) -->
<button class="theme-btn theme-btn--ghost">
  Ghost Action
</button>

<!-- Size Variants -->
<button class="theme-btn theme-btn--primary theme-btn--small">Small</button>
<button class="theme-btn theme-btn--primary theme-btn--large">Large</button>
```

### Badge Styles
```html
<span class="theme-badge theme-badge--primary">Primary</span>
<span class="theme-badge theme-badge--success">Success</span>
<span class="theme-badge theme-badge--warning">Warning</span>
<span class="theme-badge theme-badge--error">Error</span>
```

### Breadcrumb Styles
```html
<nav class="theme-breadcrumb">
  <span class="theme-breadcrumb__item">
    <a href="/" class="theme-breadcrumb__link">Home</a>
  </span>
  <span class="theme-breadcrumb__separator">/</span>
  <span class="theme-breadcrumb__item">
    <a href="/dashboard" class="theme-breadcrumb__link">Dashboard</a>
  </span>
  <span class="theme-breadcrumb__separator">/</span>
  <span class="theme-breadcrumb__item">Current Page</span>
</nav>
```

### Form Styles
```html
<div class="theme-form-group">
  <label class="theme-form-label">Label</label>
  <input type="text" class="theme-form-input" placeholder="Enter text..." />
  <div class="theme-form-help">Help text or instructions</div>
</div>

<div class="theme-form-group">
  <label class="theme-form-label">Select</label>
  <select class="theme-form-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>

<!-- Error State -->
<div class="theme-form-group">
  <input type="text" class="theme-form-input" />
  <div class="theme-form-error">This field is required</div>
</div>
```

### Table Styles
```html
<table class="theme-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

### Alert/Message Styles
```html
<!-- Success Alert -->
<div class="theme-alert theme-alert--success">
  Operation completed successfully!
</div>

<!-- Error Alert -->
<div class="theme-alert theme-alert--error">
  An error occurred. Please try again.
</div>

<!-- Warning Alert -->
<div class="theme-alert theme-alert--warning">
  Warning message here.
</div>

<!-- Info Alert -->
<div class="theme-alert theme-alert--info">
  Information message here.
</div>
```

### Loading Spinner
```html
<div class="theme-spinner"></div>
```

### Grid Layouts
```html
<!-- Auto-responsive grid -->
<div class="theme-grid">
  <div class="theme-card">Card 1</div>
  <div class="theme-card">Card 2</div>
  <div class="theme-card">Card 3</div>
</div>

<!-- Fixed 2-column layout -->
<div class="theme-grid theme-grid--2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Fixed 3-column layout -->
<div class="theme-grid theme-grid--3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

---

## 📝 Files Structure

```
assets/
  css/
    main.css          ← Base styles and CSS variables
    theme.css         ← Component styles and utilities
tailwind.config.ts    ← Tailwind configuration with custom colors
```

---

## 🔄 How to Update Theme

To change the entire application theme:

### Option 1: Update CSS Variables (Fastest)
Edit `assets/css/main.css` and change the `:root` variables:

```css
:root {
  --color-primary: #new-color;
  --color-primary-dark: #new-dark-color;
  /* ... update other variables */
}
```

### Option 2: Update Tailwind Colors
Edit `tailwind.config.ts` and update the `extend.colors` section:

```typescript
colors: {
  'primary': {
    500: '#new-primary-color',
    // ... update other shades
  },
}
```

### Option 3: Update Component Styles
For specific component styling, edit `assets/css/theme.css`:

```css
.btn-primary {
  background-color: var(--color-primary);
  /* ... update styles */
}
```

---

## 🎭 Component Architecture

### Page-Level Components
- Use `theme-card`, `theme-btn`, `theme-alert` classes for consistent styling
- Apply page layout using grid and flexbox utilities
- Reference CSS variables for custom colors

### Feature Components
- Import from `app/components/features/`
- Use Tailwind classes combined with theme variables
- Props should control content, not styling

### UI Components
- Low-level, reusable components in `app/components/ui/`
- Accept variant props if needed
- Apply theme classes consistently

---

## 🚀 Best Practices

1. **Use CSS Variables** for any custom colors
   ```css
   color: var(--color-primary); ✅ Good
   color: #2d3389; ❌ Avoid
   ```

2. **Use Theme Classes** for common patterns
   ```html
   <div class="theme-card"> ✅ Good
   <div class="p-6 border rounded-lg"> ❌ Avoid (repetitive)
   ```

3. **Maintain Spacing Consistency**
   ```css
   padding: var(--spacing-lg); ✅ Good
   padding: 24px; ❌ Avoid (magic numbers)
   ```

4. **Use Transition Variables** for smooth interactions
   ```css
   transition: all var(--transition-base); ✅ Good
   transition: all 0.3s ease-in-out; ❌ Avoid (inconsistent)
   ```

5. **Reference Theme Colors in Tailwind**
   ```html
   <button class="bg-primary-500">Click</button> ✅ Good
   <button class="bg-blue-500">Click</button> ❌ Avoid
   ```

---

## 📱 Responsive Design

The theme includes mobile-first responsive utilities:

```css
/* Base (mobile) */
.theme-grid {
  grid-template-columns: 1fr;
}

/* Tablet+ */
@media (min-width: 768px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop+ */
@media (min-width: 1024px) {
  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## ✨ Future Enhancements

- [ ] Theme customization panel for admins
- [ ] Additional component variants
- [ ] Animation library integration
- [ ] Accessibility improvements (WCAG compliance)

---

## 📞 Support

For questions about the design system, refer to:
- `assets/css/main.css` - Variables and base styles
- `assets/css/theme.css` - Component classes
- `tailwind.config.ts` - Tailwind configuration
