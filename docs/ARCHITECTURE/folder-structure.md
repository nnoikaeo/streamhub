---
title: Folder Structure
version: 1.0
updated: 2024-01-21
---

# Folder Structure

Understanding how files are organized in StreamHub.

## Directory Tree

```
streamhub/
│
├── 📁 app/                          # Nuxt application
│   ├── 📁 composables/
│   │   └── useAuth.ts              # Authentication logic
│   │
│   ├── 📁 components/              # Reusable Vue components
│   │   └── (coming soon)
│   │
│   ├── 📁 layouts/
│   │   ├── auth.vue                # Auth page layout
│   │   └── default.vue             # Main page layout
│   │
│   ├── 📁 middleware/
│   │   └── auth.ts                 # Route protection
│   │
│   ├── 📁 pages/
│   │   ├── index.vue               # Home page
│   │   ├── login.vue               # Login page
│   │   └── 📁 dashboard/
│   │       ├── index.vue           # Dashboard home
│   │       ├── users.vue           # (planned)
│   │       └── settings.vue        # (planned)
│   │
│   ├── 📁 plugins/
│   │   └── firebase.ts             # Firebase initialization
│   │
│   ├── 📁 stores/
│   │   ├── auth.ts                 # Auth state (Pinia)
│   │   └── (app state stores)
│   │
│   ├── 📁 utils/
│   │   ├── firebase.ts             # Firebase config
│   │   └── schemas.ts              # Validation schemas
│   │
│   └── app.vue                      # Root component
│
├── 📁 assets/
│   ├── 📁 css/
│   │   └── main.css               # Global styles
│   └── (images, icons)
│
├── 📁 docs/                         # 📖 Documentation
│   ├── GETTING-STARTED/
│   ├── ARCHITECTURE/
│   ├── GUIDES/
│   ├── OPERATIONS/
│   ├── TROUBLESHOOTING/
│   ├── CONTRIBUTING/
│   └── REFERENCE/
│
├── 📁 public/                       # Static files
│   ├── favicon.ico
│   └── robots.txt
│
├── 📁 .github/                      # GitHub config
│   └── copilot-instructions.md
│
├── 📁 .nuxt/                        # Auto-generated build
│   └── (gitignored)
│
├── 📁 .output/                      # Production build
│   └── (gitignored)
│
├── 📄 .env                          # Environment variables
│   └── (gitignored - secrets!)
│
├── 📄 .env.example                  # Template
│
├── 📄 .gitignore                    # Git exclusions
│
├── 📄 eslint.config.mjs             # Linting rules
│
├── 📄 nuxt.config.ts                # Nuxt configuration
│
├── 📄 package.json                  # Dependencies
│
├── 📄 package-lock.json             # Lock file
│
├── 📄 tsconfig.json                 # TypeScript config
│
├── 📄 README.md                     # Project overview
│
└── 📄 LICENSE                       # MIT License
```

---

## Directory Purposes

### `/app` - Nuxt Application

| Folder | Purpose |
|--------|---------|
| `composables/` | Vue 3 Composition functions (logic reuse) |
| `components/` | Reusable Vue components |
| `layouts/` | Page wrapper layouts |
| `middleware/` | Route guards & protection |
| `pages/` | Application pages (auto-routing) |
| `plugins/` | Initialize plugins (Firebase, etc.) |
| `stores/` | Pinia state management |
| `utils/` | Helper functions, constants |

### `/assets` - Static Assets

- Global CSS
- Images
- Icons
- Fonts

### `/docs` - Documentation

See [Documentation Structure](../README.md) for details.

### `/public` - Static Files

Served as-is, no processing:
- `favicon.ico`
- `robots.txt`
- `sitemap.xml` (future)

---

## Key Files Explained

### `app.vue`
- Root Vue component
- Wraps all pages
- Initialize app-level logic

### `nuxt.config.ts`
- Nuxt configuration
- Module imports
- Build settings
- Runtime config

### `package.json`
- Dependencies list
- Script commands
- Project metadata

### `.env`
- Secret credentials (⚠️ gitignored)
- Never commit this file!

### `.env.example`
- Template for `.env`
- Shows required variables
- **Commit this file!**

### `.gitignore`
- Files not tracked by Git
- Dependencies, builds, secrets

### `tsconfig.json`
- TypeScript compiler options
- Path aliases (`~` = root)

---

## Auto-Generated Folders (Gitignored)

### `.nuxt/`
- Dev build artifacts
- Auto-generated types
- Re-created on `npm run dev`

### `.output/`
- Production build
- Created by `npm run build`
- Deployed to Firebase Hosting

### `node_modules/`
- Installed dependencies
- Large (1000+ files)
- Always gitignored

---

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `UserCard.vue`)
- **Pages:** kebab-case (e.g., `dashboard-users.vue`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Stores:** camelCase (e.g., `authStore.ts`)

### Folders
- **Parent:** PascalCase (e.g., `GETTING-STARTED/`)
- **Nested:** kebab-case (e.g., `user-management/`)

---

## File Relationships

```
pages/login.vue
    ↓
uses middleware auth.ts
uses composable useAuth.ts
    ↓
uses store auth.ts
    ↓
uses plugin firebase.ts
    ↓
uses util firebase.ts (config)
```

---

## Adding New Features

Example: Adding "Users" page

```bash
# 1. Create page
touch app/pages/dashboard/users.vue

# 2. Create composable (if needed)
touch app/composables/useUsers.ts

# 3. Add store (if needed)
touch app/stores/users.ts

# 4. Create component (if needed)
mkdir -p app/components/Users
touch app/components/Users/UserCard.vue

# 5. Add guide
touch docs/GUIDES/users-feature.md
```

---

## Best Practices

✅ **DO:**
- Keep components focused & small
- Use composables for logic reuse
- Store in Pinia for global state
- Document new files

❌ **DON'T:**
- Put logic in components
- Create deeply nested folders
- Use app.vue for page content
- Ignore TypeScript errors

---

## See Also

- [Architecture Overview](overview.md)
- [Tech Stack Details](tech-stack.md)
- [Contributing Guide](../CONTRIBUTING/workflow.md)
