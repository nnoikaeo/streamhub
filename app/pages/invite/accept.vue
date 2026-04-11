<script setup lang="ts">
import logoImage from '../../../assets/images/logo.png'

definePageMeta({
  layout: false,
  middleware: []  // No auth middleware — user may not be logged in
})

const route = useRoute()
const code = route.query.code as string

const { isFirestore: useFirestore, apiBase: getApiBase } = useServiceMode()
const apiBase = getApiBase('invitations')

const authStore = useAuthStore()
const invitation = ref<any>(null)
const errorMessage = ref('')
const status = ref<'loading' | 'valid' | 'invalid' | 'expired' | 'cancelled' | 'already_accepted' | 'email_mismatch' | 'processing' | 'success' | 'error'>('loading')

// Wait for Firebase auth state to resolve (app.vue calls initAuth)
const waitForAuthReady = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!authStore.loading) return resolve()
    const unwatch = watch(() => authStore.loading, (val) => {
      if (!val) {
        unwatch()
        resolve()
      }
    })
  })
}

// Phase 1: Verify invitation (read-only)
const verifyInvitation = async () => {
  if (!code) {
    status.value = 'invalid'
    errorMessage.value = 'ไม่พบรหัสคำเชิญ'
    return
  }

  try {
    const response = await $fetch<any>(`${apiBase}/verify`, {
      query: { code }
    })

    if (response.status === 'valid') {
      invitation.value = response.data
      checkEmailMatch()
    } else if (response.status === 'already_accepted') {
      status.value = 'already_accepted'
    } else if (response.status === 'expired') {
      status.value = 'expired'
    } else if (response.status === 'cancelled') {
      status.value = 'cancelled'
    } else {
      status.value = 'invalid'
      errorMessage.value = 'ไม่พบคำเชิญหรือคำเชิญไม่ถูกต้อง'
    }
  } catch (err: any) {
    console.error('Failed to verify invitation:', err)
    status.value = 'error'
    errorMessage.value = 'ไม่สามารถตรวจสอบคำเชิญได้ กรุณาลองใหม่อีกครั้ง'
  }
}

// Check if current user email matches invitation email
const checkEmailMatch = () => {
  if (!invitation.value) return

  if (authStore.isAuthenticated) {
    if (authStore.user?.email?.toLowerCase() === invitation.value.email.toLowerCase()) {
      status.value = 'valid'
    } else {
      status.value = 'email_mismatch'
    }
  } else {
    status.value = 'valid'
  }
}

// Phase 2: Accept invitation
const handleAccept = async () => {
  status.value = 'processing'

  try {
    const response = await $fetch<any>(`${apiBase}/accept`, {
      method: 'POST',
      body: {
        invitationCode: code,
        uid: authStore.user?.uid,
        email: authStore.user?.email,
        displayName: authStore.user?.displayName,
        photoURL: authStore.user?.photoURL
      }
    })

    if (response.success) {
      // Update auth store with new user data
      authStore.setUser({
        uid: authStore.user!.uid,
        email: authStore.user!.email,
        displayName: authStore.user!.displayName,
        photoURL: authStore.user!.photoURL,
        role: invitation.value.role,
        company: invitation.value.company
      })
      authStore.setAuthError(null)
      status.value = 'success'
      setTimeout(() => navigateTo('/dashboard/discover'), 2000)
    } else if (response.error === 'Email mismatch') {
      status.value = 'email_mismatch'
    } else {
      status.value = 'error'
      errorMessage.value = response.message || response.error || 'ไม่สามารถยืนยันคำเชิญได้ กรุณาลองใหม่อีกครั้ง'
    }
  } catch (err: any) {
    console.error('Failed to accept invitation:', err)
    status.value = 'error'
    errorMessage.value = 'ไม่สามารถยืนยันคำเชิญได้ กรุณาลองใหม่อีกครั้ง'
  }
}

// Sign in with Google then accept (uses redirect — page navigates away to Google)
const signInAndAccept = async () => {
  const { signInWithGoogle } = useAuth()
  await signInWithGoogle()
  // Page navigates away to Google, code below does not run
}

// Sign out and reset to valid state
const handleSignOutAndRetry = async () => {
  const { logout } = useAuth()
  try {
    await logout()
    // Don't redirect — stay on this page
    status.value = 'valid'
  } catch {
    // Even if logout fails, reset status
    status.value = 'valid'
  }
}

// แปลชื่อ role เป็นภาษาไทย
const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    moderator: 'ผู้ดูแล',
    user: 'ผู้ใช้งาน'
  }
  return roleMap[role] || role
}

onMounted(async () => {
  // First check if returning from Google redirect (skipAutoAccept: true — this page handles acceptance)
  const { handleRedirectResult } = useAuth()
  const redirectResult = await handleRedirectResult({ skipAutoAccept: true })

  if (redirectResult !== null) {
    // Returning from Google redirect — verify invitation then process sign-in result
    await verifyInvitation()
    if (redirectResult.success) {
      if (authStore.user?.email?.toLowerCase() === invitation.value?.email?.toLowerCase()) {
        await handleAccept()
      } else {
        status.value = 'email_mismatch'
      }
    } else {
      status.value = 'error'
      errorMessage.value = redirectResult.error || 'ลงชื่อเข้าใช้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    }
  } else {
    // Normal page load — wait for auth state before verifying
    await waitForAuthReady()
    await verifyInvitation()
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
    <div class="invite-card">
      <!-- Logo -->
      <div class="flex justify-center mb-6">
        <img :src="logoImage" alt="StreamHub Logo" class="invite-logo" />
      </div>

      <ClientOnly>
        <!-- Loading State -->
        <div v-if="status === 'loading'" class="text-center">
          <div class="flex justify-center mb-4">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-500" />
          </div>
          <p class="text-slate-600">กำลังตรวจสอบคำเชิญ...</p>
        </div>

        <!-- Valid: Not logged in -->
        <div v-else-if="status === 'valid' && !authStore.isAuthenticated" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3">
              <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คุณได้รับเชิญเข้าร่วมระบบ</h2>
            <p class="text-slate-600">
              คุณได้รับเชิญให้เข้าร่วม
              <span class="font-semibold text-slate-800">{{ invitation?.company }}</span>
              ในฐานะ
              <span class="font-semibold text-blue-600">{{ formatRole(invitation?.role || '') }}</span>
            </p>
          </div>

          <!-- Message from inviter -->
          <div v-if="invitation?.message" class="bg-slate-50 rounded-lg p-3 mb-5 text-left">
            <p class="text-sm text-slate-500 mb-1">ข้อความจากผู้เชิญ:</p>
            <p class="text-sm text-slate-700 italic">"{{ invitation.message }}"</p>
          </div>

          <p class="text-sm text-slate-500 mb-4">
            คำเชิญส่งถึง: <span class="font-medium text-slate-700">{{ invitation?.email }}</span>
          </p>

          <button @click="signInAndAccept" class="invite-button">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff"/>
            </svg>
            ลงชื่อเข้าด้วย Google เพื่อยอมรับ
          </button>
        </div>

        <!-- Valid: Logged in, email matches -->
        <div v-else-if="status === 'valid' && authStore.isAuthenticated" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-3">
              <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คุณได้รับเชิญเข้าร่วมระบบ</h2>
            <p class="text-slate-600">
              คุณได้รับเชิญให้เข้าร่วม
              <span class="font-semibold text-slate-800">{{ invitation?.company }}</span>
              ในฐานะ
              <span class="font-semibold text-blue-600">{{ formatRole(invitation?.role || '') }}</span>
            </p>
          </div>

          <!-- Message from inviter -->
          <div v-if="invitation?.message" class="bg-slate-50 rounded-lg p-3 mb-5 text-left">
            <p class="text-sm text-slate-500 mb-1">ข้อความจากผู้เชิญ:</p>
            <p class="text-sm text-slate-700 italic">"{{ invitation.message }}"</p>
          </div>

          <p class="text-sm text-slate-500 mb-4">
            ลงชื่อเข้าเป็น: <span class="font-medium text-slate-700">{{ authStore.user?.email }}</span>
          </p>

          <button @click="handleAccept" class="invite-button invite-button--accept">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            ยอมรับและเข้าร่วม
          </button>
        </div>

        <!-- Email Mismatch -->
        <div v-else-if="status === 'email_mismatch'" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mb-3">
              <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">อีเมลไม่ตรงกัน</h2>
            <p class="text-slate-600 mb-3">
              คุณลงชื่อเข้าด้วย
              <span class="font-semibold text-slate-800">{{ authStore.user?.email }}</span>
            </p>
            <p class="text-slate-600">
              แต่คำเชิญนี้ส่งถึง
              <span class="font-semibold text-blue-600">{{ invitation?.email }}</span>
            </p>
          </div>

          <button @click="handleSignOutAndRetry" class="invite-button invite-button--warning">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบและใช้บัญชีที่ถูกต้อง
          </button>
        </div>

        <!-- Processing -->
        <div v-else-if="status === 'processing'" class="text-center">
          <div class="flex justify-center mb-4">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-green-500" />
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">กำลังตั้งค่าบัญชี...</h2>
          <p class="text-slate-600">กรุณารอสักครู่</p>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-3">
              <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-green-700 mb-2">ยินดีต้อนรับ!</h2>
            <p class="text-slate-600">ตั้งค่าบัญชีของคุณเรียบร้อยแล้ว กำลังนำคุณเข้าสู่ระบบ...</p>
          </div>
        </div>

        <!-- Already Accepted -->
        <div v-else-if="status === 'already_accepted'" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3">
              <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คำเชิญนี้ถูกใช้งานไปแล้ว</h2>
            <p class="text-slate-600 mb-5">คำเชิญนี้ได้รับการยืนยันเรียบร้อยแล้ว</p>
          </div>

          <NuxtLink to="/dashboard/discover" class="invite-link">
            ไปที่หน้าหลัก
          </NuxtLink>
        </div>

        <!-- Expired -->
        <div v-else-if="status === 'expired'" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mb-3">
              <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คำเชิญหมดอายุแล้ว</h2>
            <p class="text-slate-600 mb-5">คำเชิญนี้หมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อขอคำเชิญใหม่</p>
          </div>

          <NuxtLink to="/login" class="invite-link">
            กลับไปหน้าเข้าสู่ระบบ
          </NuxtLink>
        </div>

        <!-- Cancelled -->
        <div v-else-if="status === 'cancelled'" class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
              <svg class="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คำเชิญถูกยกเลิกแล้ว</h2>
            <p class="text-slate-600 mb-5">คำเชิญนี้ถูกยกเลิกแล้ว กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>

          <NuxtLink to="/login" class="invite-link">
            กลับไปหน้าเข้าสู่ระบบ
          </NuxtLink>
        </div>

        <!-- Invalid / Error -->
        <div v-else class="text-center">
          <div class="mb-4">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-3">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">คำเชิญไม่ถูกต้อง</h2>
            <p class="text-slate-600 mb-5">{{ errorMessage || 'ไม่พบคำเชิญหรือคำเชิญไม่ถูกต้อง' }}</p>
          </div>

          <NuxtLink to="/login" class="invite-link">
            กลับไปหน้าเข้าสู่ระบบ
          </NuxtLink>
        </div>

        <template #fallback>
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-500" />
            </div>
            <p class="text-slate-600">กำลังโหลด...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.invite-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.invite-logo {
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.invite-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: var(--color-info);
  color: var(--color-text-inverse);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.invite-button:hover {
  opacity: 0.9;
}

.invite-button--accept {
  background-color: var(--color-success);
}

.invite-button--warning {
  background-color: var(--color-warning);
  color: #1a1a1a;
}

.invite-link {
  display: inline-block;
  color: var(--color-info);
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.invite-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
