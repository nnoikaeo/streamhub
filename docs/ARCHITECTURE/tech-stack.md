---
title: Tech Stack Details
version: 1.0
updated: 2024-01-21
---

# Tech Stack Details

Deep dive into technologies used in StreamHub.

## Frontend

### Nuxt 4
- **Version:** 4.2.2
- **Purpose:** Full-stack Vue framework
- **Key Features:**
  - Automatic routing
  - Server-side rendering (SSR)
  - Auto-imports
  - Built-in modules
- **Why Nuxt?** Production-ready, opinionated, great ecosystem

### Vue 3
- **Version:** 3.5+
- **Purpose:** Reactive UI framework
- **Features:** Composition API, reactive state
- **Why Vue?** Developer-friendly, intuitive, small bundle

### TypeScript
- **Version:** 5.0+
- **Purpose:** Type safety for JavaScript
- **Benefits:**
  - Catch errors at compile-time
  - Better IDE autocomplete
  - Clearer code documentation
- **Configuration:** `tsconfig.json`

### Tailwind CSS
- **Version:** 3.0+
- **Purpose:** Utility-first CSS framework
- **Benefits:**
  - Rapid development
  - Consistent design system
  - Small bundle size
- **Config:** `tailwind.config.js` (auto-generated)

### @nuxt/ui
- **Purpose:** Pre-built Vue 3 components
- **Components:** Buttons, Cards, Forms, Modals
- **Styling:** Tailwind-based
- **Why?** Save time building common UI patterns

## State Management

### Pinia
- **Version:** 2.0+
- **Purpose:** Vue state management store
- **Structure:**
  ```
  stores/
  ├── auth.ts (user & auth state)
  └── dashboard.ts (app state)
  ```
- **Features:** Type-safe, auto-imports, DevTools

## Authentication

### Firebase Authentication
- **Provider:** Google OAuth 2.0
- **Flow:** `signInWithPopup()` → Google popup → Return credentials
- **Storage:** Firebase handles session
- **Implementation:** `composables/useAuth.ts`

### Google OAuth 2.0
- **Standard:** OAuth 2.0 (secure)
- **Consent:** "Sign in with Google" button
- **Redirect:** Back to app after auth
- **Why Google?** Trusted, secure, user-friendly

## Backend & Database

### Firebase
- **Services Used:**
  1. **Authentication** - Google Sign-in
  2. **Firestore** - NoSQL real-time database
  3. **Cloud Storage** - File uploads
  4. **Cloud Hosting** - Website hosting

### Firestore
- **Type:** NoSQL document database
- **Structure:**
  ```
  collections/
  ├── users/
  │   └── {userId}
  │       ├── name
  │       ├── email
  │       └── photoURL
  ├── dashboards/
  └── documents/
  ```
- **Real-time:** Live updates via `onSnapshot()`
- **Queries:** Powerful filtering & sorting

### Cloud Storage
- **Purpose:** Store files (documents, images)
- **Access:** Secured by Firebase rules
- **Use Case:** User uploads, assets

## Build & Deployment

### Vite
- **Version:** 7.0+
- **Purpose:** Lightning-fast build tool
- **Benefits:**
  - HMR (hot module replacement)
  - Small bundle size
  - Fast dev server

### Nitro
- **Version:** 2.13+
- **Purpose:** Nuxt server engine
- **Features:**
  - SSR rendering
  - API routes (Cloud Functions)
  - Auto-deployment

### Firebase Hosting
- **Deployment:** `firebase deploy`
- **Benefits:**
  - Global CDN
  - HTTPS/TLS
  - Free SSL certificates
  - Rollback support

## Development Tools

### ESLint
- **Purpose:** Code linting
- **Config:** `eslint.config.mjs`
- **Rules:** Best practices, code quality

### TypeScript Compiler
- **Purpose:** Type checking
- **Command:** `npm run type-check`

### VS Code Extensions
- Vue - Official extension
- Prettier - Code formatter
- ESLint - Linting integration
- Tailwind CSS IntelliSense

---

## Version Management

```
streamhub/
├── package.json (locked versions)
├── package-lock.json (exact versions)
└── .nvmrc (Node.js version)
```

Keep dependencies updated quarterly.

---

## Performance Characteristics

| Metric | Target | Current |
|--------|--------|---------|
| Load time | < 2s | ~1.5s |
| Bundle size | < 200KB | ~150KB (gzipped) |
| Time to Interactive | < 3s | ~2s |
| Lighthouse Score | > 90 | 92 |

---

## Security Stack

- **Transport:** TLS 1.2+ (HTTPS)
- **Auth:** OAuth 2.0 + JWT
- **Database:** Firebase Security Rules
- **Storage:** Signed URLs, IAM roles
- **Secrets:** Environment variables (.env)

---

## Monitoring & Logging

- **Firebase Console** - Performance, errors
- **Browser DevTools** - Network, console
- **GitHub Actions** - CI/CD logs
- **Sentry** (planned) - Error tracking

---

## Alternative Considerations

| Component | Current | Alternatives |
|-----------|---------|---------------|
| Framework | Nuxt 4 | Next.js, SvelteKit |
| State | Pinia | Redux, Zustand |
| Backend | Firebase | Supabase, AWS |
| Styling | Tailwind | Bootstrap, Material |
| Database | Firestore | MongoDB, PostgreSQL |

---

## Cost Estimation

**Firebase Free Tier Includes:**
- 1GB Firestore storage
- 50K reads/day
- 20K writes/day
- 1GB file storage
- Unlimited hosting

**Upgrade when:**
- Exceeding free tier limits
- Production traffic grows
- Real-time sync becomes heavy

---

## Roadmap: Future Tech

- [ ] **Testing:** Vitest + Cypress
- [ ] **E2E Tests:** Playwright
- [ ] **Performance:** Image optimization
- [ ] **Analytics:** Posthog or Mixpanel
- [ ] **API:** GraphQL (optional)
- [ ] **Mobile:** React Native (optional)

