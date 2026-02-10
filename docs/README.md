# 📚 StreamHub Documentation

Welcome to StreamHub's comprehensive documentation. This guide covers all aspects of the application architecture, design system, and implementation patterns.

---

## 🚀 Quick Start

**New to StreamHub?** Start with these essential guides:

1. **[Architecture Guide](../ARCHITECTURE_GUIDE.md)** - Overview of component structure and design principles (root)
2. **[Strategy 4: Hybrid Approach](STRATEGY_4_HYBRID_APPROACH.md)** - Recommended page architecture using Pinia & Composables
3. **[Component Conventions](COMPONENT_CONVENTIONS.md)** - How to organize and name components

---

## 📖 Documentation Index

### Core Architecture
- **[ARCHITECTURE_GUIDE.md](../ARCHITECTURE_GUIDE.md)** - Main architecture overview
  - Component layer structure
  - CSS architecture and design tokens
  - Layout patterns

### Page Reusability & State Management
- **[STRATEGY_4_HYBRID_APPROACH.md](STRATEGY_4_HYBRID_APPROACH.md)** - **Recommended for new pages**
  - Hybrid approach combining layouts, stores, and composables
  - Pinia store management
  - Composable logic extraction
  - Permission integration
  - Real-world examples
  - Implementation guide
  - Testing strategies

- **[PERMISSIONS_STORE.md](PERMISSIONS_STORE.md)** - Role-based access control
  - Permission store architecture
  - User roles (admin, editor, viewer, user)
  - Permission checking methods
  - UI component integration
  - Practical examples
  - Testing approaches

### Testing & Quality Assurance
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Strategy 4 implementation testing
  - Type checking verification
  - Manual code verification
  - Runtime testing procedures
  - Browser testing checklist
  - Code quality assessment
  - Documentation verification
  - Sign-off template

### Design System
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Design tokens and styling
  - CSS variables reference
  - Color system
  - Spacing, typography, shadows
  - Theme customization

- **[COMPONENT_CONVENTIONS.md](COMPONENT_CONVENTIONS.md)** - Component organization
  - Component layers (layouts, compositions, ui, features)
  - Auto-import prefix configuration
  - Naming conventions
  - Best practices

- **[LAYOUT_COMPONENTS.md](LAYOUT_COMPONENTS.md)** - Layout patterns
  - Layout components (AppLayout, AuthLayout, etc.)
  - Composition components
  - Responsive design
  - Slot patterns

### Reference & Audit
- **[THEME_AUDIT_REPORT.md](THEME_AUDIT_REPORT.md)** - Theme implementation analysis
  - Current theme audit results
  - CSS variable usage
  - Component styling review

---

## 🎯 By Use Case

### "I want to create a new page"
1. Read: [Strategy 4: Hybrid Approach](STRATEGY_4_HYBRID_APPROACH.md)
2. Reference: [Component Conventions](COMPONENT_CONVENTIONS.md)
3. Implement: Follow the step-by-step guide in Strategy 4

### "I need to manage permissions"
1. Read: [Permissions Store](PERMISSIONS_STORE.md)
2. Reference: Integration examples in Strategy 4
3. Implement: Use `usePermissionsStore()` in your composable

### "I'm refactoring an existing page"
1. Read: [Strategy 4: Hybrid Approach](STRATEGY_4_HYBRID_APPROACH.md) - Migration Guide section
2. Extract logic to composables
3. Create Pinia stores for state
4. Simplify component code

### "I need to customize styling"
1. Read: [Design System](DESIGN_SYSTEM.md)
2. Reference: CSS variables in theme.css
3. Update: Modify CSS variables (not hardcoded colors)

### "I want to add a new component"
1. Read: [Component Conventions](COMPONENT_CONVENTIONS.md)
2. Reference: [Layout Components](LAYOUT_COMPONENTS.md)
3. Implement: Follow the layer structure

---

## 📂 Directory Structure

```
docs/
├── README.md                              ← You are here
├── STRATEGY_4_HYBRID_APPROACH.md          ← New page architecture (⭐ START HERE)
├── PERMISSIONS_STORE.md                   ← Access control
├── TESTING_CHECKLIST.md                   ← Testing guide (✓ NEW)
├── COMPONENT_CONVENTIONS.md               ← Component organization
├── DESIGN_SYSTEM.md                       ← Design tokens
├── LAYOUT_COMPONENTS.md                   ← Layout patterns
└── THEME_AUDIT_REPORT.md                  ← Reference
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│     StreamHub Application               │
├─────────────────────────────────────────┤
│                                         │
│  Pages (discover.vue, admin.vue, etc.) │
│       ↓                                 │
│  Composables (useDashboardPage, etc.)   │
│       ↓                                 │
│  Pinia Stores (dashboard, permissions) │
│       ↓                                 │
│  Components (Layouts, UI, Features)    │
│       ↓                                 │
│  CSS Variables (Design System)          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎓 Key Concepts

### Strategy 4: Hybrid Approach
The recommended architecture combining:
- **Layouts** - Visual structure and composition
- **Pinia Stores** - Centralized state management
- **Composables** - Reusable logic extraction
- **Permissions** - Role-based access control

**Benefits:**
- ✅ Maximum reusability (one composable, multiple pages)
- ✅ Centralized state (shared across app)
- ✅ Permission integration (automatic UI control)
- ✅ Clean components (70% less code)
- ✅ Easy to test

### Design Tokens
StreamHub uses CSS variables for consistent styling:
- Colors (primary, secondary, neutral, status)
- Spacing (xs, sm, md, lg, xl)
- Shadows (sm, md, lg)
- Border radius (sm, md, lg)
- Transitions (fast, base, slow)

All defined in `assets/css/main.css`

### Component Layers
1. **Layouts** - Page structure foundation
2. **Compositions** - Reusable sections
3. **UI** - Generic building blocks
4. **Features** - Domain-specific components

---

## 🔗 Important Files (Root)

**Keep in root directory:**
- `ARCHITECTURE_GUIDE.md` - Main architecture overview
- `README.md` - Project readme
- `nuxt.config.ts` - Nuxt configuration with component auto-import setup
- `package.json` - Dependencies

---

## 🚦 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| ARCHITECTURE_GUIDE.md | ✅ Current | Feb 11, 2025 |
| STRATEGY_4_HYBRID_APPROACH.md | ✅ Current | Feb 11, 2025 |
| PERMISSIONS_STORE.md | ✅ Current | Feb 11, 2025 |
| TESTING_CHECKLIST.md | ✅ Current | Feb 11, 2025 |
| COMPONENT_CONVENTIONS.md | ✅ Current | Feb 10, 2025 |
| DESIGN_SYSTEM.md | ✅ Current | Feb 10, 2025 |
| LAYOUT_COMPONENTS.md | ✅ Current | Feb 10, 2025 |
| THEME_AUDIT_REPORT.md | ✅ Reference | Feb 3, 2025 |

---

## 💡 Tips

### Finding Documentation
- **Can't find what you need?** Use Ctrl+F (⌘+F) to search
- **Looking for examples?** Check Strategy 4 or Permissions Store docs
- **Need API reference?** See PERMISSIONS_STORE.md methods section

### Contributing
When updating documentation:
1. Keep examples current with actual code
2. Add links between related sections
3. Include practical examples
4. Test code snippets

### Common Questions

**Q: Where do I put my new component?**
A: See COMPONENT_CONVENTIONS.md - Choose the right layer

**Q: How do I reuse page logic?**
A: Use Strategy 4 pattern - create a composable

**Q: How do permissions work?**
A: See PERMISSIONS_STORE.md - Integrated into composables

**Q: Where are design tokens?**
A: See DESIGN_SYSTEM.md and `assets/css/main.css`

---

## 🎯 Next Steps

1. **Start here:** Read [ARCHITECTURE_GUIDE.md](../ARCHITECTURE_GUIDE.md)
2. **Then read:** [STRATEGY_4_HYBRID_APPROACH.md](STRATEGY_4_HYBRID_APPROACH.md)
3. **Keep handy:** [PERMISSIONS_STORE.md](PERMISSIONS_STORE.md)
4. **Reference:** [COMPONENT_CONVENTIONS.md](COMPONENT_CONVENTIONS.md)

---

## 📞 Questions?

For questions about:
- **Architecture** → See ARCHITECTURE_GUIDE.md
- **Building pages** → See STRATEGY_4_HYBRID_APPROACH.md
- **Permissions** → See PERMISSIONS_STORE.md
- **Components** → See COMPONENT_CONVENTIONS.md
- **Design** → See DESIGN_SYSTEM.md

---

**Generated:** Feb 11, 2025
**Last Updated:** Strategy 4 implementation complete
