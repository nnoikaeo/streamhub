---
title: Data Flow Diagram
version: 1.0
updated: 2024-01-21
---

# Data Flow Diagram

Visual representation of how data moves through StreamHub.

## 1. Authentication Flow

```
┌────────────────────────────────────────────────────┐
│            User Interaction                         │
│  1. Open http://localhost:3000/login               │
│  2. Click "Sign in with Google"                    │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  login.vue (Component)                             │
│  ├─ handleGoogleSignIn() called                    │
│  └─ signInWithGoogle() from useAuth()              │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  useAuth Composable                                │
│  ├─ Create GoogleAuthProvider                      │
│  ├─ Call signInWithPopup()                         │
│  └─ Wait for OAuth callback                        │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│         Firebase Authentication SDK                │
│  ├─ Open OAuth popup                              │
│  ├─ Redirect to Google Sign-in                    │
│  └─ Return credentials to app                     │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│    Google OAuth Server                             │
│  ├─ Prompt user to sign in                        │
│  ├─ Request user permissions                      │
│  └─ Return tokens to Firebase                     │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│    Firebase Auth State Changed                     │
│  ├─ onAuthStateChanged() fires                    │
│  └─ User data available                           │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  useAuth Composable                                │
│  ├─ Extract user data (email, uid, etc.)         │
│  └─ Call authStore.setUser()                      │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  Pinia Auth Store                                  │
│  ├─ user.value = { uid, email, ... }             │
│  ├─ isAuthenticated = true                        │
│  └─ loading = false                               │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  Middleware: auth.ts                               │
│  ├─ Check authStore.isAuthenticated                │
│  ├─ If true → allow dashboard                     │
│  └─ If false → redirect to login                  │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│  Router: navigateTo('/dashboard')                  │
│  ├─ Load dashboard page                           │
│  └─ Render user data                              │
└────────────────────────────────────────────────────┘
                      ↓
✅ AUTHENTICATED & LOGGED IN
```

---

## 2. User State Management Flow

```
┌──────────────────────────────────────────┐
│   User Logs In (from diagram above)      │
└──────────────────────────────────────────┘
                ↓
        ┌───────────────┐
        │  Auth Store   │
        │ ┌───────────┐ │
        │ │ user      │ │
        │ │ loading   │ │
        │ │ computed  │ │
        │ │ actions   │ │
        │ └───────────┘ │
        └───────────────┘
            ↙     ↓     ↘
    ┌─────────────────────────┐
    │  Any Component Can Access │
    │                           │
    │  const authStore = useAuthStore()
    │  {{ authStore.user.email }}
    │  {{ authStore.isAuthenticated }}
    │
    │  Reactive! Auto-updates on change
    └─────────────────────────┘
```

### Store Structure

```typescript
auth.ts (Pinia Store)
├── State
│   ├── user: UserData | null
│   ├── loading: boolean
│   └── computed: isAuthenticated
├── Actions
│   ├── setUser(newUser)
│   └── setLoading(loading)
└── Getters
    └── isAuthenticated (computed)
```

---

## 3. Page Navigation with Auth

```
User visits URL
       ↓
┌─────────────────────┐
│ Middleware Runs     │
│ (before page load)  │
└─────────────────────┘
       ↓
     ┌─┴─┐
     │   │ Auth state?
    Yes  No
     │    │
     ↓    ↓
   PAGE  → /login
   LOAD   (redirect)
     ↓
   RENDER
```

### Route Protection Examples

```
/login          → Always accessible
/dashboard      → Requires auth ✓
/dashboard/users → Requires auth ✓
/settings       → Requires auth ✓
```

---

## 4. Firestore Real-time Data Flow

```
Component needs user data
       ↓
useComposable.fetchUsers()
       ↓
Firebase Query: 
  db.collection('users')
    .where('active', '==', true)
    .onSnapshot()
       ↓
Real-time Listener Active
       ↓
    ┌──────┬──────┬──────┐
    │      │      │      │
   Read   Write  Delete  Update
    │      │      │      │
    └──────┴──────┴──────┘
           ↓
   Update Pinia Store
       ↓
   Component Reactive Data Updates
       ↓
   UI Re-renders
```

---

## 5. Component Render Cycle

```
Component Mounts
    ↓
setup() / onMounted()
    ↓
Subscribe to data sources:
- Auth store
- Firestore listeners
- Router state
    ↓
Template receives reactive data
    ↓
User interacts (click, input, etc.)
    ↓
Event handler fires
    ↓
Update store / DB
    ↓
Reactivity triggers update
    ↓
Template re-renders
    ↓
Component Unmounts
    ↓
Cleanup:
- Unsubscribe listeners
- Clear state
```

---

## 6. Error Handling Flow

```
Error Occurs (anywhere)
        ↓
    ┌───┴───┐
    │       │
Firebase  UI Event
Error     Error
  │         │
  └───┬─────┘
      ↓
Error Handler
  (try-catch block)
      ↓
Store error state
(optional)
      ↓
Display to user:
- Toast message
- Error banner
- Console log
      ↓
User can retry or navigate away
```

---

## 7. Data Persistence

```
┌─────────────────┐
│  Browser Memory │  (Session)
│                 │  - Fast
│ - Pinia Store   │  - Lost on refresh
│ - Component Data│
└─────────────────┘
        ↓ (save)
┌─────────────────┐
│  Firebase Auth  │  (Persistent)
│                 │  - Encrypted
│ - User ID       │  - Survives refresh
│ - Tokens        │
└─────────────────┘
        ↓ (read on load)
┌─────────────────┐
│  Pinia Store    │  (Restored)
│                 │  - Reloaded
│  - User data    │
└─────────────────┘
```

---

## 8. API Call Sequence

```
Component
  ↓
[1] User clicks "Load Data"
  ↓
[2] Composable receives request
  ↓
[3] Show loading state
  ↓
[4] Firestore query
  ↓
[5] Fetch from Firebase
  ↓
[6] Parse response
  ↓
[7] Store in Pinia
  ↓
[8] Hide loading state
  ↓
[9] Show data in UI
  ↓
[10] User sees results ✅
```

**Timing:**
- Step 1-3: < 10ms
- Step 4-6: 100-500ms (network)
- Step 7-10: < 50ms

---

## 9. Logout Flow

```
User clicks "Logout"
       ↓
handleLogout() called
       ↓
useAuth().logout()
       ↓
firebase.auth().signOut()
       ↓
Firebase clears session
       ↓
onAuthStateChanged() fires
       ↓
setUser(null)
       ↓
Pinia updated:
- user = null
- isAuthenticated = false
       ↓
Middleware redirects
       ↓
navigateTo('/login')
       ↓
✅ Logged Out
```

---

## 10. Deployment Pipeline

```
Local Code
    ↓
git commit + git push
    ↓
GitHub receives
    ↓
(GitHub Actions) ← Future CI/CD
    ↓
npm run build
    ↓
.output/ folder created
    ↓
firebase deploy
    ↓
Upload to Firebase Hosting
    ↓
CDN distribution
    ↓
Users see new version
```

---

## Performance Metrics

| Operation | Time | Where |
|-----------|------|-------|
| Page load | 1-2s | Browser |
| Auth sign-in | 2-5s | Firebase + Google |
| Firestore query | 100-500ms | Network |
| Component render | < 50ms | Browser |
| State update | < 10ms | Pinia |

---

## See Also

- [Architecture Overview](overview.md)
- [Tech Stack Details](tech-stack.md)
- [Authentication Guide](../GUIDES/authentication.md)
