<script setup lang="ts">
import logoImage from '../../assets/images/logo.png'
import { mapErrorMessage } from '~/utils/errorMessages'
import ErrorDialog from '~/components/ErrorDialog.vue'

const router = useRouter()
const route = useRoute()
const { signInWithGoogle } = useAuth()
const authStore = useAuthStore()
const loading = ref(false)
const showErrorDialog = ref(false)
const errorInfo = ref({
  title: '',
  message: '',
  showRequestAccess: false
})

console.log('📄 [login.vue] Page mounted')
console.log('📄 [login.vue] Route info:', {
  path: route.path,
  name: route.name,
  params: route.params
})

definePageMeta({
  layout: false,  // Disable default layout
  middleware: 'auth'  // Explicitly apply auth middleware
})

const handleGoogleSignIn = async () => {
  loading.value = true
  showErrorDialog.value = false

  try {
    const result = await signInWithGoogle()

    if (result.success) {
      const targetRoute = '/dashboard'
      console.log(`🎉 Redirecting to ${targetRoute} (role: ${authStore.user?.role})...`)
      await new Promise(resolve => setTimeout(resolve, 500))
      await router.push(targetRoute)
    } else {
      const error = new Error(result.error)
      errorInfo.value = mapErrorMessage(error)
      showErrorDialog.value = true
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    errorInfo.value = mapErrorMessage(error)
    showErrorDialog.value = true
  } finally {
    loading.value = false
  }
}

const handleCloseErrorDialog = () => {
  showErrorDialog.value = false
}

const handleRequestAccess = () => {
  // Open contact form or email
  window.location.href = 'mailto:it@streamwash.com?subject=Request%20Access%20to%20Dashboard%20Hub'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
    <div class="login-card">
        <!-- Logo Section -->
        <div class="flex justify-center mb-6">
          <img
            :src="logoImage"
            alt="Streamwash Logo"
            class="login-logo"
          />
        </div>

        <!-- Title -->
        <h2 class="text-3xl font-bold text-center mb-2 text-slate-900">Dashboard Hub</h2>

        <!-- Subtitle -->
        <p class="text-center text-xs text-slate-500 mb-8">
          ระบบบริหารจัดการแดชบอร์ด
        </p>

        <ClientOnly>
          <!-- Sign In Button -->
          <button
            key="sign-in-button"
            @click="handleGoogleSignIn"
            :disabled="loading"
            class="login-button mb-6"
          >
            <svg class="login-button__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff"/>
            </svg>
            {{ loading ? 'กำลังลงชื่อเข้า...' : 'ลงชื่อเข้าด้วย Google' }}
          </button>

          <!-- Error Dialog -->
          <ErrorDialog
            :is-open="showErrorDialog"
            :title="errorInfo.title"
            :message="errorInfo.message"
            :show-request-access="errorInfo.showRequestAccess"
            @close="handleCloseErrorDialog"
            @request-access="handleRequestAccess"
          />
        </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
/* Login Card Container */
.login-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

/* Logo */
.login-logo {
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

/* Login Button */
.login-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: var(--color-info);
  color: var(--color-text-inverse);
  font-size: 1rem;          /* 16px - ขนาดข้อความ */
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  cursor: pointer;
}

.login-button:hover:not(:disabled) {
  background-color: #1d4ed8;
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background-color: var(--color-neutral-400);
  cursor: not-allowed;
  opacity: 0.6;
}

.login-button__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>
