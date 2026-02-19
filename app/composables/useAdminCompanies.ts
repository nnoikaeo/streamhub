/**
 * Admin Companies Management Composable
 * Provides CRUD operations for companies resource
 *
 * Usage:
 * const { companies, loading, fetchCompanies, createCompany, updateCompany, deleteCompany } = useAdminCompanies()
 */

import type { Company } from '~/types/dashboard'

export function useAdminCompanies() {
  const companies = ref<Company[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all companies
   */
  const fetchCompanies = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Company[]
        total: number
      }>('/api/mock/companies')

      if (response.success) {
        companies.value = response.data || []
        console.log(`✅ Loaded ${companies.value.length} companies`)
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error fetching companies:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new company
   */
  const createCompany = async (companyData: Partial<Company>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Company
        action: string
      }>('/api/mock/companies', {
        method: 'POST',
        body: {
          code: companyData.code,
          name: companyData.name,
          country: companyData.country,
          isActive: companyData.isActive ?? true,
          ...companyData
        }
      })

      if (response.success) {
        console.log(`✅ Company "${companyData.code}" created`)
        await fetchCompanies() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error creating company:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing company
   */
  const updateCompany = async (code: string, updates: Partial<Company>) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        data: Company
        action: string
      }>('/api/mock/companies', {
        method: 'POST',
        body: {
          code,
          ...updates
        }
      })

      if (response.success) {
        console.log(`✅ Company "${code}" updated`)
        await fetchCompanies() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error updating company:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete company by code
   */
  const deleteCompany = async (code: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        deleted: boolean
        message: string
      }>(`/api/mock/companies/${code}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ Company "${code}" deleted`)
        await fetchCompanies() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error('❌ Error deleting company:', e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State (readonly)
    companies: readonly(companies),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}
