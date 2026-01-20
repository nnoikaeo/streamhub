import { defineStore } from 'pinia'

export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserData | null>(null)
  const loading = ref(true)
  const isAuthenticated = computed(() => !!user.value)

  const setUser = (newUser: UserData | null) => {
    user.value = newUser
  }

  const setLoading = (newLoading: boolean) => {
    loading.value = newLoading
  }

  return {
    user,
    loading,
    isAuthenticated,
    setUser,
    setLoading
  }
})
