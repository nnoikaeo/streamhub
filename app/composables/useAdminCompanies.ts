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
    skipCompanyFilter: true,
    defaults: {
      isActive: true
    },
    // `code` is the Firestore doc id — without this guard a duplicate code
    // would silently overwrite the existing company via setDoc.
    uniqueFields: [{ field: 'code', message: 'รหัสบริษัทซ้ำ' }]
  })

  // Create backward-compatible aliases for existing page code
  return {
    companies: resource.items,
    fetchCompanies: resource.fetch,
    createCompany: resource.create,
    updateCompany: resource.update,
    deleteCompany: resource.delete,

    // Also expose generic API for flexibility (includes loading, error, items, fetch, etc.)
    ...resource
  }
}
