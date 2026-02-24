/**
 * Admin Companies Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing companies
 *
 * Usage:
 * const { items: companies, loading, fetch, create, update, delete } = useAdminCompanies()
 */

import { useAdminResource } from './useAdminResource'
import type { Company } from '~/types/admin'

export function useAdminCompanies() {
  const resource = useAdminResource<Company>({
    resourceName: 'companies',
    idKey: 'code',
    displayKey: 'code',
    defaults: {
      isActive: true
    }
  })

  // Create backward-compatible aliases for existing page code
  return {
    companies: resource.items,
    loading: resource.loading,
    error: resource.error,
    fetchCompanies: resource.fetch,
    createCompany: resource.create,
    updateCompany: resource.update,
    deleteCompany: resource.delete,

    // Also expose generic API for flexibility
    ...resource
  }
}
