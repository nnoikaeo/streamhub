# Auth Middleware Test Plan

## 📋 Overview

This document describes how to test the authentication middleware implementation that addresses proper authentication flow and navigation protection.

**Middleware File:** `app/middleware/auth.ts`

**Status:** Implemented ✅ | Ready for testing 🧪

---

## 🎯 Test Scenarios

### Scenario 1: Unauthenticated User Accesses Home Page

**Setup:**
- Clear browser cookies/localStorage or use private/incognito window
- Dev server running: `npm run dev` on http://localhost:3000

**Action:**
1. Navigate to http://localhost:3000/

**Expected Behavior:**
✅ **Middleware triggers:**
- Detects `authStore.loading === false` and `authStore.isAuthenticated === false`
- Logs: `🔐 [auth.middleware] User not authenticated, redirecting to login`

✅ **Automatic redirect:**
- URL changes to http://localhost:3000/login
- Login page displays (email input + Google login button)

✅ **No auto-login:**
- User must click "Sign in with Google" button manually
- No automatic Firebase auth popup

**Console Logs (F12 → Console):**
```
🔍 [app.vue] initializing
🔍 [app.vue] onMounted called { loading: true, authenticated: false }
🔍 [app.vue] calling initAuth because loading is true
📡 Initializing auth listener...
🔍 Auth state changed: not logged in
🔍 [useAuth.initAuth] Setting loading to false
🔍 [app.vue] initAuth completed
🔐 [auth.middleware] User not authenticated, redirecting to login
```

---

### Scenario 2: User in Mock Data Signs In

**Setup:**
- On login page (from Scenario 1)
- Have mock user available: `somchai@email.com` or any user in `mockUsers` array

**Action:**
1. Click "Sign in with Google"
2. Sign in with Google account that matches a user in mockUsers (see table below)
3. Firebase popup appears and completes authentication

**Mock Users Available (from useMockData.ts):**
| Email | UID | Role | Company |
|-------|-----|------|---------|
| somchai@stramhub.local | user-1 | admin | STTH |
| nattha@stramhub.local | user-2 | moderator | STTH |
| sarawut@stramhub.local | user-3 | admin | STTN |
| priya@stramhub.local | user-4 | moderator | STTN |
| arun@stramhub.local | user-5 | admin | STCS |
| maya@stramhub.local | user-6 | moderator | STCS |

> **Note:** Google OAuth won't authenticate with @stramhub.local emails. For actual testing, you need to either:
> - Add your real email to mockUsers with your Google account's UID
> - Or use a different sign-in provider (see **Testing Strategy** below)

**Expected Behavior:**
✅ **Firebase authentication succeeds:**
- Google OAuth completes
- User credential obtained from Firebase

✅ **User lookup in mockUsers:**
- Logs: `🔍 [useAuth.signInWithGoogle] Got mock user with role: admin`
- Auth store updated with: `uid, email, displayName, photoURL, role, company`

✅ **Automatic redirect to dashboard:**
- Logs: `📊 [auth.middleware] Redirecting authenticated user from index to dashboard`
- URL changes to http://localhost:3000/dashboard/discover
- Dashboard page displays

✅ **Company context set:**
- User company from mockUsers is stored in auth store
- Dashboard filters to show only user's company dashboards

**Console Logs:**
```
🔐 Starting Google Sign-in...
Auth object: [Firebase auth instance]
🔑 Google Provider created
✅ Sign-in successful: user@gmail.com
🔍 [useAuth.signInWithGoogle] Got mock user with role: admin
🔍 [useAuth.signInWithGoogle] Setting user data: {...}
✅ [auth.middleware] User authenticated: user@gmail.com
📊 [auth.middleware] Redirecting authenticated user from index to dashboard
```

---

### Scenario 3: User NOT in Mock Data Signs In (Error Case)

**Setup:**
- On login page
- Use Google account that is NOT in mockUsers (e.g., your real email: n.noikaeo@gmail.com)

**Action:**
1. Click "Sign in with Google"
2. Authenticate with Google account
3. Firebase confirms authentication but user UID not found in mockUsers

**Expected Behavior:**
✅ **Firebase authentication succeeds:**
- Google OAuth completes
- User credential obtained

✅ **User lookup fails:**
- Logs: `❌ [useAuth.signInWithGoogle] User profile not found: User with UID "xxx" not found in system...`
- `signInWithGoogle()` returns: `{ success: false, error: "User with UID..." }`
- Auth store: `user = null`, `authError = "User with UID..."` set

✅ **Redirect to index (not dashboard):**
- Logs: `❌ [auth.middleware] User has auth error, allowing on index only`
- URL changes to http://localhost:3000/
- Index page displays

✅ **Error message shown:**
- Red error box appears on index page
- Message: "User with UID "xxx" not found in system. Please contact administrator to set up your account."
- User cannot navigate to dashboard pages (redirect back to index if attempted)

✅ **User can retry or logout:**
- Need "Sign out" button on index page (if user wants to try different email)
- Or contact admin to add their email to mockUsers

**Console Logs:**
```
🔐 Starting Google Sign-in...
✅ Sign-in successful: n.noikaeo@gmail.com
❌ User profile not found: User with UID "xxx" not found in system. Please contact administrator...
❌ [auth.middleware] User has auth error, allowing on index only
```

**Index Page Display:**
```
┌─────────────────────────────────────────┐
│ Index                                   │
├─────────────────────────────────────────┤
│ 🔴 AUTHENTICATION ERROR                 │
│ User with UID "xxx" not found in system │
│ Please contact your administrator...    │
│                                         │
│ [Go to Login]                           │
└─────────────────────────────────────────┘
```

---

### Scenario 4: Authenticated User Navigates to Protected Routes

**Setup:**
- User successfully authenticated (from Scenario 2)
- Currently on dashboard (/dashboard/discover)

**Action:**
1. Try to navigate to http://localhost:3000/ (home page)

**Expected Behavior:**
✅ **Middleware checks auth state:**
- `authStore.isAuthenticated === true` and `authStore.authError === null`
- Logs: `✅ [auth.middleware] User authenticated: user@gmail.com`

✅ **Automatic redirect:**
- Since user is on index (`to.name === 'index'`) and authenticated with no errors
- Logs: `📊 [auth.middleware] Redirecting authenticated user from index to dashboard`
- URL changes back to http://localhost:3000/dashboard/discover
- Stays on dashboard

✅ **Protected pages (e.g., /admin):**
- If user is NOT admin role, they can still access /admin page (no role-based routing yet)
- Middleware only checks authentication, not authorization
- (Authorization will be implemented in Phase 2)

---

### Scenario 5: Page Reload While Authenticated

**Setup:**
- User authenticated and on dashboard
- Close devtools, refresh page: Cmd/Ctrl + R

**Action:**
1. Press Cmd/Ctrl + R or F5 to refresh

**Expected Behavior:**
✅ **Firebase detects persistent auth:**
- Firebase onAuthStateChanged fires
- User session is restored from browser storage

✅ **App.vue initializes:**
- Logs: `🔍 [app.vue] initializing`
- Logs: `🔍 [app.vue] onMounted called { loading: true, ... }`
- Calls `initAuth()`

✅ **Auth state restored:**
- Logs: `🔍 Auth state changed: user@gmail.com`
- Logs: `🔍 [useAuth.initAuth] Got mock user with role: admin`
- `authStore.setLoading(false)`

✅ **Page stays on dashboard:**
- Middleware runs after loading completes
- User is still authenticated, no redirect needed
- Dashboard remains visible

✅ **No re-login required:**
- User doesn't need to sign in again
- Session persists across page refreshes

**Console Logs:**
```
🔍 [app.vue] initializing
🔍 [app.vue] onMounted called { loading: true, authenticated: false }
🔍 [app.vue] calling initAuth because loading is true
📡 Initializing auth listener...
🔍 Auth state changed: somchai@stramhub.local
🔍 [useAuth.initAuth] Got mock user with role: admin
🔍 [useAuth.initAuth] Setting loading to false
🔍 [app.vue] initAuth completed
✅ [auth.middleware] User authenticated: somchai@stramhub.local
```

---

## 🧪 Testing Strategy

### For Real Google OAuth Testing

Since mockUsers have @stramhub.local emails that won't work with Google OAuth:

**Option A: Add your email to mockUsers**
1. Edit `app/composables/useMockData.ts`
2. Find your real Google account's UID:
   - Sign in with Google on any Firebase app
   - Check Firebase Console → Users → View your UID
3. Add user to mockUsers:
   ```typescript
   {
     uid: 'YOUR_GOOGLE_UID',
     email: 'your.email@gmail.com',
     displayName: 'Your Name',
     role: 'admin',
     company: 'STTH'
   }
   ```
4. Test Scenario 2 with your real email

**Option B: Use a different provider (future)**
- Phase 2 could add Email/Password or other providers
- For now, only Google OAuth is configured

**Option C: Use mock auth (development only)**
- Create a `/dev-login` page that doesn't require Firebase
- Directly sets auth store for testing
- Future consideration for faster development

---

## ✅ Test Checklist

- [ ] Scenario 1: Unauthenticated → Redirects to /login ✅
- [ ] Scenario 2: Valid user → Redirects to /dashboard/discover ✅
- [ ] Scenario 3: Invalid user → Shows error on index ✅
- [ ] Scenario 4: Authenticated → Can't navigate to index (redirects to dashboard) ✅
- [ ] Scenario 5: Page reload → Session persists, no re-login ✅

**Additional Checks:**
- [ ] Console logs match expected output
- [ ] No console errors
- [ ] No infinite redirects
- [ ] Middleware loads quickly (no visible flicker)
- [ ] Error message displays clearly
- [ ] All buttons clickable and functional

---

## 🔍 Debugging Tips

### Check Auth State
Open F12 console and run:
```javascript
// In Nuxt app
const authStore = useAuthStore()
console.log('Auth Store:', {
  user: authStore.user,
  loading: authStore.loading,
  authenticated: authStore.isAuthenticated,
  authError: authStore.authError
})
```

### Monitor Middleware
Watch console logs with prefix:
- 🔍 = Info
- 🔐 = Not authenticated
- ✅ = Authenticated
- ❌ = Error
- 📊 = Redirect
- 🔄 = Loading

### Check Network/Auth
- F12 → Network → Filter by XHR/Fetch
- Look for Firebase auth requests
- F12 → Application → Cookies → Check Firebase session token

### Inspect Middleware Conditions
Middleware in `app/middleware/auth.ts` checks these conditions in order:
1. If loading → wait (return early)
2. If not authenticated → redirect to login (or allow public pages)
3. If authenticated + authError → allow only on index (show error)
4. If authenticated + no error + on index → redirect to dashboard

---

## 📝 Implementation Files

| File | Purpose | Status |
|------|---------|--------|
| `app/middleware/auth.ts` | Route protection middleware | ✅ Created |
| `app/composables/useAuth.ts` | Auth initialization + error handling | ✅ Updated |
| `app/stores/auth.ts` | Auth state (user, loading, authError) | ✅ Updated |
| `app/pages/index.vue` | Home page with error display | ✅ Updated |
| `app/app.vue` | Root component + auth init | ✅ Verified |
| `app/composables/useMockData.ts` | Mock users + companies | ✅ Updated |

---

## 🚀 Next Steps (After Testing)

1. **Commit changes** to `feat/phase-1-company-setup` branch
   ```bash
   git add app/middleware/auth.ts
   git commit -m "feat: implement auth middleware for proper route protection"
   ```

2. **Add logout functionality** (if not already present)
   - Add "Sign Out" button to user menu
   - Call `useAuth().logout()`

3. **Add real email to mockUsers** (for testing)
   - Edit `app/composables/useMockData.ts`
   - Add your Google account details

4. **Phase 1B: Firestore Collections**
   - Migrate from JSON to Firestore
   - Implement security rules
   - Follow `workflow.md` step by step

---

**Created:** 2026-02-14
**Auth Middleware Status:** Ready for testing 🧪
