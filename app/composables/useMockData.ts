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
} from '~/types/dashboard'

// Company type is defined in ~/types/admin (single source of truth)
export type { Company } from '~/types/admin'

// ============================================================================
// COMPANY HELPERS
// ============================================================================

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
 * Get ancestor folder IDs for a given folder (walking up to root).
 * Only returns ancestors that have inheritPermissions=true.
 */
export function getInheritingAncestorFolders(
  folderId: string,
  folders: Folder[]
): Folder[] {
  const ancestors: Folder[] = []
  let currentId: string | null | undefined = folderId

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId)
    if (!folder) break

    if (folder.inheritPermissions && folder.access) {
      ancestors.push(folder)
    }

    currentId = folder.parentId
  }

  return ancestors
}

/**
 * Check if access/restrictions from a single source grant access to a user.
 * Returns true if Layer 1 or Layer 2 matches.
 */
function checkAccessRules(
  access: { direct: { users: string[]; groups: string[] }; company: string[] },
  user: User
): boolean {
  // Layer 1: Direct access (OR logic)
  if (access.direct.users.includes(user.uid)) return true
  for (const group of user.groups) {
    if (access.direct.groups.includes(group)) return true
  }
  // Layer 2: Company-scoped
  // Empty company array means "all companies" — everyone has access
  if (access.company.length === 0) return true
  if (access.company.includes(user.company)) return true
  return false
}

/**
 * Check if any restriction (revoke/expiry) blocks a user.
 */
function checkRestrictions(
  restrictions: { revoke: string[]; expiry: { [userId: string]: Date } },
  userId: string
): boolean {
  if (restrictions.revoke.includes(userId)) return true
  const expiryDate = restrictions.expiry[userId]
  if (expiryDate && new Date() > new Date(expiryDate as any)) return true
  return false
}

/**
 * Get all dashboards accessible to a user
 * (Based on 3-layer permission model with folder inheritance)
 *
 * OR-merge formula:
 *   Final = (DashboardPerms OR FolderPerms) AND NOT (DashboardRestrictions OR FolderRestrictions)
 */
export function getAccessibleDashboards(
  user: User,
  dashboards: Dashboard[],
  folders?: Folder[]
): Dashboard[] {
  return dashboards.filter((dashboard) => {
    // Admins can see all dashboards (except they still respect explicit revocation for security)
    if (user.role === 'admin') {
      if (dashboard.restrictions.revoke.includes(user.uid)) {
        return false
      }
      return true
    }

    // Non-admins cannot see archived dashboards
    if (dashboard.isArchived) {
      return false
    }

    // Collect inheriting ancestor folders for this dashboard
    const ancestorFolders = folders
      ? getInheritingAncestorFolders(dashboard.folderId, folders)
      : []

    // Check ALL restrictions first (dashboard + folder) — deny overrides
    // Dashboard restrictions
    if (checkRestrictions(dashboard.restrictions, user.uid)) {
      return false
    }
    // Folder restrictions
    for (const folder of ancestorFolders) {
      if (folder.restrictions && checkRestrictions(folder.restrictions, user.uid)) {
        return false
      }
    }

    // OR-merge: Dashboard permissions OR any ancestor folder permissions
    if (checkAccessRules(dashboard.access, user)) {
      return true
    }
    for (const folder of ancestorFolders) {
      if (folder.access && checkAccessRules(folder.access, user)) {
        return true
      }
    }

    return false
  })
}
