import { defineStore } from 'pinia'

export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role?: string
  company?: string  // Company code (e.g., 'STTH', 'STTN') - NEW for multi-company support
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserData | null>(null)
  const loading = ref(true)
  const isAuthenticated = computed(() => !!user.value)
  const userCompany = computed(() => user.value?.company || null)

  const setUser = (newUser: UserData | null) => {
    user.value = newUser
  }

  const setLoading = (newLoading: boolean) => {
    loading.value = newLoading
  }

  const setCompany = (companyCode: string) => {
    if (user.value) {
      user.value.company = companyCode
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    userCompany,
    setUser,
    setLoading,
    setCompany
  }
})
