/**
 * Admin Management Types
 * Consolidated type definitions for all admin resources
 */

/**
 * Region resource
 */
export interface Region {
  code: string
  name: string
  description?: string
  sortOrder?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Company resource
 */
export interface Company {
  code: string
  name: string
  description?: string
  region?: string
  regionRole?: 'hub' | 'sub'
  sortOrder?: number
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
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Re-export from dashboard types
 */
export type { User, Folder, Dashboard } from './dashboard'
