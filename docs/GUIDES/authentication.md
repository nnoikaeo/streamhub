---
title: Authentication System
version: 2.1
updated: 2026-08-20
---

# Authentication System

Complete guide to StreamHub authentication.

## Overview

StreamHub uses **Google OAuth 2.0** as the sole authentication method, through a **popup** (`signInWithPopup`). The popup resolves inline, so there is no return leg to process — the same call that opens the window also returns the credential.

```
User → signInWithPopup → หน้าต่าง accounts.google.com → ผู้ใช้เลือกบัญชี → หน้าต่างปิด
     → credential กลับมาที่ promise เดิม → โหลด users/{uid} → Dashboard
```

> **ประวัติของ flow นี้ อ่านก่อนคิดจะสลับกลับ** — เคยเป็น popup → เปลี่ยนเป็น `signInWithRedirect` เพื่อแก้ COOP บน production (`891ed43`) → **เปลี่ยนกลับเป็น popup** เมื่อ 2026-07-18 (`37dda62`) เพราะ redirect พึ่ง third-party cookie ที่ Chrome บล็อกโดยปริยาย ทำให้ local dev ติด redirect loop · `handleRedirectResult` ถูกลบทิ้งพร้อมกัน · และ COOP ที่เป็นเหตุผลเดิมของ redirect ตอนนี้ไม่มีอยู่ใน [firebase.json](../../firebase.json) แล้ว — header ที่ตั้งไว้มีแค่ `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`, `Content-Security-Policy`, `Cache-Control`

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
  // เปิดหน้าต่าง Google — หน้าเดิมไม่ได้ถูก navigate ออกไปไหน
  const signInWithGoogle = async (options?: { skipAutoAccept?: boolean }) => {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)

    // มี credential แล้วตั้งแต่บรรทัดนี้ — จากนั้นค่อยอ่านโปรไฟล์จาก users/{uid}
    const mockUser = await fetchUserProfile(userCredential.user.uid, idToken)

    // ไม่มีเอกสารผู้ใช้ = ยังไม่เคยรับคำเชิญ → ตรวจ/รับคำเชิญให้อัตโนมัติ
    // เว้นแต่ผู้เรียกขอจัดการเอง (หน้า invite/accept ใช้ skipAutoAccept)
    ...
    return { success: true }
  }

  return { user, loading, isAuthenticated, signInWithGoogle, logout, initAuth, getIdToken }
}
```

> **ไม่มี `handleRedirectResult` แล้ว** — popup คืนผลกลับมาที่ promise เดิม หน้า `/login` จึงไม่ต้องมีขั้นตอน "ประมวลผลตอนกลับมา" ถ้าเจอโค้ดที่เรียก `getRedirectResult` แสดงว่าเป็นซากเก่า
>
> ผู้ใช้ปิดหน้าต่างเองไม่นับเป็น error — [useAuth.ts:132](../../app/composables/useAuth.ts#L132) กลืน `auth/popup-closed-by-user` และ `auth/cancelled-popup-request` แล้วคืน `{ success: false }` เฉย ๆ ไม่ตั้งข้อความแดง

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

`signInWithGoogle` จับ error เองทั้งหมดและคืน `{ success, error? }` — ไม่ throw ออกมาให้ผู้เรียก

```typescript
const { success, error } = await signInWithGoogle()
if (!success && error) {
  // error = ข้อความสำหรับผู้ใช้ และถูกตั้งลง authStore.setAuthError() ไว้แล้ว
}
// success === false โดยไม่มี error = ผู้ใช้ปิดหน้าต่างเอง ไม่ต้องแสดงอะไร
```

| code | เกิดเมื่อ | ระบบทำอะไร |
|---|---|---|
| `auth/popup-closed-by-user` | ผู้ใช้ปิดหน้าต่าง Google | เงียบ — `{ success: false }` ไม่มี error |
| `auth/cancelled-popup-request` | เปิด popup ซ้อนกัน (กดปุ่มรัว) | เงียบเหมือนกัน |
| `auth/popup-blocked` | เบราว์เซอร์บล็อก popup | ตกไปเส้นทางทั่วไป — ตั้ง `authStore.setAuthError()` แล้วแสดงข้อความ |
| อื่น ๆ | เช่น เครือข่ายล่ม, บัญชีถูกปิดใช้งาน | เหมือนกัน |

> ⚠️ `auth/popup-blocked` เป็นความเสี่ยงที่มีเฉพาะ flow นี้ และเป็นจุดที่เบราว์เซอร์ต่างกันมากที่สุด — ดู §7 ของ [manual-test-plan](../OPERATIONS/manual-test-plan.md) ก่อนทดสอบข้ามเบราว์เซอร์

---

## Testing Authentication

### Local Development

```bash
npm run dev
# Visit localhost:3000/login
# Click "Sign in with Google"
# Use your test Google account
```

> ⚠️ **authDomain caveat — ผลการทดสอบ login บน localhost ไม่แทน production**
>
> `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `streamhub-1c27a.web.app` ซึ่ง**เป็น origin เดียวกับตัวแอปบน production** แต่ตอนรัน `npm run dev` แอปอยู่ที่ `localhost:3000` ⇒ กลายเป็น cross-site
>
> ต่างกันตรงที่ storage/cookie ของ popup ถูกกันคนละแบบ:
> - **Chrome บน localhost** — ผ่าน เพราะ popup ส่งผลกลับทาง `postMessage` ไม่ได้พึ่ง third-party cookie (นี่คือเหตุผลที่ย้ายกลับมาใช้ popup ตั้งแต่แรก)
> - **Safari บน localhost** — ITP กันการเข้าถึง storage ข้าม site ⇒ login อาจล้มด้วยอาการที่ **ไม่มีอยู่จริงบน production** เพราะที่นั่นเป็น origin เดียวกัน
>
> จะสรุปว่า login พังบนเบราว์เซอร์ไหน **ต้องกดที่ `https://streamhub-1c27a.web.app` เท่านั้น** อาการบน localhost ใช้ยืนยันไม่ได้

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
- [Route Protection](../ARCHITECTURE/overview.md)
- [Firebase Setup](../GETTING-STARTED/setup-firebase.md)
