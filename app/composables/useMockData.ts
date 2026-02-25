/**
 * Mock Data Utilities for Dashboard Management System
 *
 * DEPRECATED: Mock data arrays (mockUsers, mockFolders, mockDashboards, mockCompanies, mockGroups)
 * are no longer stored in TypeScript. They are now stored in JSON files (.data/*.json) and
 * accessed via API endpoints and composables.
 *
 * This file now contains only utility functions for working with dashboard permissions
 * and folder hierarchies.
 *
 * To fetch data, use the admin composables:
 * - useAdminUsers() - for user data
 * - useAdminFolders() - for folder data
 * - useAdminDashboards() - for dashboard data
 * - useAdminCompanies() - for company data
 * - useAdminGroups() - for group data
 */

import type {
  User,
  Folder,
  Dashboard,
  AccessControl,
  AccessRestrictions,
} from '~/types/dashboard'

// ============================================================================
// COMPANY INTERFACE & HELPERS
// ============================================================================

export interface Company {
  code: string
  name: string
  country: string
  isActive: boolean
}

/**
 * Get company by code
 * @param code Company code (e.g., 'STTH', 'STTN')
 * @returns Company object or undefined
 *
 * NOTE: This function operates on data passed to it. To get actual companies,
 * use useAdminCompanies() composable instead.
 */
export function getCompanyByCode(code: string, companies: Company[]): Company | undefined {
  return companies.find(company => company.code === code)
}

/**
 * Get all active companies
 * @returns Array of active companies
 *
 * NOTE: This function filters data passed to it. To get actual active companies,
 * use useAdminCompanies() composable and filter by isActive yourself.
 */
export function getActiveCompanies(companies: Company[]): Company[] {
  return companies.filter(company => company.isActive)
}

// ============================================================================
// UTILITY FUNCTIONS FOR FOLDERS & DASHBOARDS
// ============================================================================

/**
 * Get all folders by parent ID
 */
export function getMockFoldersByParent(parentId: string | null, folders: Folder[]): Folder[] {
  return folders.filter((f) => f.parentId === parentId)
}

/**
 * Get dashboard by ID
 */
export function getMockDashboardById(id: string, dashboards: Dashboard[]): Dashboard | undefined {
  return dashboards.find((d) => d.id === id)
}

/**
 * Get all dashboards in a specific folder
 */
export function getMockDashboardsByFolder(folderId: string, dashboards: Dashboard[]): Dashboard[] {
  return dashboards.filter((d) => d.folderId === folderId)
}

/**
 * Get folder by ID with hierarchy information
 */
export function getMockFolderById(id: string, folders: Folder[]): Folder | undefined {
  return folders.find((f) => f.id === id)
}

/**
 * Build folder hierarchy (parent -> children tree)
 */
export function buildFolderHierarchy(folders: Folder[]): Map<string, Folder[]> {
  const hierarchy = new Map<string, Folder[]>()

  for (const folder of folders) {
    const parentId = folder.parentId || 'root'
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, [])
    }
    hierarchy.get(parentId)!.push(folder)
  }

  return hierarchy
}

/**
 * Get folder path (from root to specific folder)
 */
export function getFolderPath(
  folderId: string,
  folders: Folder[]
): Folder[] {
  const path: Folder[] = []
  let currentId: string | null | undefined = folderId

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId)
    if (!folder) break

    path.unshift(folder)
    currentId = folder.parentId
  }

  return path
}

/**
 * Get all dashboards accessible to a user
 * (Based on 3-layer permission model)
 */
export function getAccessibleDashboards(
  user: User,
  dashboards: Dashboard[]
): Dashboard[] {
  return dashboards.filter((dashboard) => {
    // Admins can see all dashboards (except they still respect explicit revocation for security)
    if (user.role === 'admin') {
      // Even admins are blocked by explicit revocation
      if (dashboard.restrictions.revoke.includes(user.uid)) {
        return false
      }
      return true
    }

    // Check if archived - non-admins cannot see archived dashboards
    // (admins already returned above)
    if (dashboard.isArchived) {
      return false
    }

    const access = dashboard.access
    const restrictions = dashboard.restrictions

    // Layer 3: Check restrictions first (explicit deny)
    if (restrictions.revoke.includes(user.uid)) {
      return false // User is explicitly revoked
    }

    const expiryDate = restrictions.expiry[user.uid]
    if (expiryDate) {
      if (new Date() > expiryDate) {
        return false // User's access has expired
      }
    }

    // Layer 1: Direct access (OR logic)
    if (access.direct.users.includes(user.uid)) {
      return true
    }

    if (access.direct.roles.includes(user.role)) {
      return true
    }

    for (const group of user.groups) {
      if (access.direct.groups.includes(group)) {
        return true
      }
    }

    // Layer 2: Company-scoped (AND logic: company + (role OR group))
    const companyAccess = access.company[user.company]
    if (companyAccess) {
      if (companyAccess.roles.includes(user.role)) {
        return true
      }

      for (const group of user.groups) {
        if (companyAccess.groups.includes(group)) {
          return true
        }
      }
    }

    return false
  })
}
