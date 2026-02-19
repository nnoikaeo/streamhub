/**
 * Admin Management Types
 * Consolidated type definitions for all admin resources
 */

/**
 * Company resource
 */
export interface Company {
  code: string
  name: string
  country: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Admin Group resource
 */
export interface AdminGroup {
  id: string
  name: string
  description?: string
  members: string[]
  createdAt?: string
  updatedAt?: string
}

/**
 * Re-export from dashboard types
 */
export type { User, Folder, Dashboard } from './dashboard'
