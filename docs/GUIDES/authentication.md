---
title: Authentication System
version: 1.0
updated: 2024-01-21
---

# Authentication System

Complete guide to StreamHub authentication.

## Overview

StreamHub uses **Google OAuth 2.0** as the sole authentication method.

```
User → Google Sign-in → Firebase Auth → Dashboard
```

---

## Files Involved

```
app/
├── pages/login.vue           # Login UI
├── composables/useAuth.ts    # Auth logic
├── stores/auth.ts            # Auth state
├── middleware/auth.ts        # Route protection
├── plugins/firebase.ts       # Firebase init
└── utils/firebase.ts         # Firebase config
```

---

## Implementation Details

### 1. Login Page (`pages/login.vue`)

```vue
<script setup>
const { signInWithGoogle } = useAuth()

async function handleGoogleSignIn() {
  const result = await signInWithGoogle()
  if (result.success) {
    await navigateTo('/dashboard')
  }
}
</script>

<template>
  <button @click="handleGoogleSignIn">
    Sign in with Google
  </button>
</template>
```

### 2. Auth Composable (`composables/useAuth.ts`)

```typescript
export const useAuth = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    
    // Extract only needed data
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL
    }
    
    authStore.setUser(userData)
    return { success: true }
  }
  
  return { signInWithGoogle }
}
```

### 3. Auth Store (`stores/auth.ts`)

```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserData | null>(null)
  const isAuthenticated = computed(() => !!user.value)
  
  const setUser = (newUser: UserData | null) => {
    user.value = newUser
  }
  
  return { user, isAuthenticated, setUser }
})
```

### 4. Route Middleware (`middleware/auth.ts`)

```typescript
export default (to, from) => {
  const authStore = useAuthStore()
  
  // Wait for auth to load
  if (authStore.loading) return
  
  // Redirect logic
  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/dashboard')
  }
  
  if (!authStore.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
}
```

---

## Security Considerations

✅ **Current Security:**
- OAuth 2.0 (industry standard)
- Google handles credential verification
- JWT tokens from Firebase
- Tokens encrypted in browser storage

⚠️ **Never Do:**
- Store passwords in code
- Expose Firebase credentials
- Trust client-side validation alone
- Skip server-side verification

---

## User Sessions

### Session Lifecycle

```
1. User signs in
2. Firebase creates JWT token
3. Token stored in browser
4. Token sent with each request
5. Firebase validates token
6. User logged out → Token cleared
```

### Token Expiration

- **Access Token:** ~1 hour
- **Refresh Token:** Months
- **Auto-refresh:** Firebase handles it
- **Manual refresh:** Not needed (usually)

---

## Logout Implementation

```typescript
const logout = async () => {
  await signOut(firebase.auth)
  authStore.setUser(null)
  await navigateTo('/login')
}
```

---

## Error Handling

```typescript
try {
  await signInWithGoogle()
} catch (error) {
  if (error.code === 'auth/popup-closed-by-user') {
    // User closed popup
  } else if (error.code === 'auth/popup-blocked') {
    // Popup was blocked by browser
  } else {
    // Other error
  }
}
```

---

## Testing Authentication

### Local Development

```bash
npm run dev
# Visit localhost:3000/login
# Click "Sign in with Google"
# Use your test Google account
```

### Test Account

Create a Google test account for development:
1. Go to [Google Account](https://myaccount.google.com/)
2. Create test email
3. Use only for development

### Debugging

```typescript
// In console
const auth = useAuthStore()
console.log(auth.user)         // See user data
console.log(auth.isAuthenticated) // Auth status
```

---

## Permissions & Scopes

Current OAuth scopes:
- `email` - User email address
- `profile` - User display name, photo

Adding more scopes:
```typescript
const provider = new GoogleAuthProvider()
provider.addScope('https://www.googleapis.com/auth/calendar')
```

---

## Next Steps

- [Database Schema](database-schema.md)
- [Route Protection](../../ARCHITECTURE/overview.md)
- [Firebase Setup](../../GETTING-STARTED/setup-firebase.md)
