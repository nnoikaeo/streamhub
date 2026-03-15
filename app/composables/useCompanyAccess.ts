/**
 * Company Access Composable
 * ใช้สำหรับเช็คสิทธิ์ company-level บน client-side
 */
export function useCompanyAccess() {
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()

  /** User's home company */
  const userCompany = computed(() => authStore.user?.company || '')

  /** Is admin (can access all companies) */
  const isAdmin = computed(() => permissionsStore.isAdmin)

  /**
   * เช็คว่า user มีสิทธิ์เข้าถึง company ที่ระบุ
   */
  const canAccessCompany = (companyCode: string): boolean => {
    if (isAdmin.value) return true
    return userCompany.value === companyCode
  }

  /**
   * Filter items ตาม company ของ user
   * Admin: ไม่ filter (เห็นทุก company)
   * Others: filter เฉพาะ items ที่มี company ตรงกัน
   */
  const filterByCompany = <T extends { company?: string }>(items: T[]): T[] => {
    if (isAdmin.value) return items
    return items.filter(item => !item.company || item.company === userCompany.value)
  }

  /**
   * Get company label สำหรับ display
   */
  const getCompanyLabel = (code: string): string => {
    // จะถูกเพิ่ม company name lookup ทีหลัง
    return code
  }

  return {
    userCompany,
    isAdmin,
    canAccessCompany,
    filterByCompany,
    getCompanyLabel,
  }
}
