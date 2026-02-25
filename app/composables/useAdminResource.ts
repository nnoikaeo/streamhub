/**
 * Generic Admin Resource Management Composable
 *
 * Provides reusable CRUD operations for any admin resource (users, companies, folders, groups, dashboards)
 * Eliminates code duplication across all admin composables while maintaining type safety
 *
 * @template T - The resource type (User, Company, Folder, etc.)
 *
 * Usage Example:
 * ```typescript
 * export function useAdminUsers() {
 *   return useAdminResource<User>({
 *     resourceName: 'users',
 *     idKey: 'uid',
 *     displayKey: 'email',
 *     idPrefix: 'user_',
 *     defaults: { role: 'user', isActive: true }
 *   })
 * }
 * ```
 */

import { ref, readonly } from 'vue'
import type { Ref } from 'vue'

/**
 * Configuration for generic admin resource
 */
interface AdminResourceConfig<T> {
  /**
   * Resource name for API endpoint (e.g., 'users', 'companies')
   * Used to construct: /api/mock/{resourceName}
   */
  resourceName: string

  /**
   * Primary key field name for this resource
   * Examples: 'uid', 'code', 'id'
   */
  idKey: keyof T

  /**
   * Field to display in console logs (defaults to idKey)
   * Examples: 'email', 'name', 'code'
   */
  displayKey?: keyof T

  /**
   * Prefix for auto-generated IDs
   * Examples: 'user_', 'folder_', 'dash_'
   */
  idPrefix?: string

  /**
   * Default values to merge when creating resources
   */
  defaults?: Partial<T>

  /**
   * Custom extension methods for resource-specific utilities
   */
  extensions?: ResourceExtensions<T>

  /**
   * Plural name for console logs (defaults to resourceName + 's')
   */
  pluralName?: string
}

/**
 * Extension methods that can be added to specific resources
 */
interface ResourceExtensions<T> {
  [methodName: string]: (items: Ref<T[]>, ...args: any[]) => any
}

/**
 * Standard API response for fetch operations
 */
interface FetchResponse<T> {
  success: boolean
  data: T[]
  total: number
}

/**
 * Standard API response for create/update operations
 */
interface MutationResponse<T> {
  success: boolean
  data: T
  action: string
}

/**
 * Standard API response for delete operations
 */
interface DeleteResponse {
  success: boolean
  deleted: boolean
  message: string
}

/**
 * Return type for the generic composable
 */
interface AdminResourceReturn<T> {
  // State (readonly)
  items: Readonly<Ref<T[]>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>

  // Core CRUD operations
  fetch: () => Promise<void>
  create: (data: Partial<T>) => Promise<T | undefined>
  update: (id: string | number, updates: Partial<T>) => Promise<T | undefined>
  delete: (id: string | number) => Promise<boolean | undefined>

  // Extension methods (if provided)
  [extensionMethod: string]: any
}

/**
 * Generic admin resource management composable
 * Provides CRUD operations for any resource type
 *
 * @template T - The resource type
 * @param config - Configuration object for the resource
 * @returns Admin resource management functions and state
 */
export function useAdminResource<T extends Record<string, any>>(
  config: AdminResourceConfig<T>
): AdminResourceReturn<T> {
  // State management
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Extract configuration with defaults
  const {
    resourceName,
    idKey,
    displayKey = idKey,
    idPrefix,
    defaults = {},
    extensions = {},
    pluralName = resourceName.endsWith('s') ? resourceName : `${resourceName}s`
  } = config

  /**
   * Get display value from item for console logs
   */
  const getDisplayValue = (item: Partial<T> | T): string => {
    const displayVal = item[displayKey as keyof typeof item]
    return String(displayVal || item[idKey as keyof typeof item] || 'unknown')
  }

  /**
   * Generate ID if needed
   */
  const generateId = (data: Partial<T>): string | number | undefined => {
    const existingId = data[idKey as keyof typeof data]
    if (existingId) return existingId

    if (idPrefix) {
      return `${idPrefix}${Date.now()}`
    }

    return undefined
  }

  /**
   * Merge data with defaults
   */
  const mergeWithDefaults = (data: Partial<T>): Partial<T> => {
    return {
      ...defaults,
      ...data
    }
  }

  /**
   * Fetch all items
   */
  const fetch = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<FetchResponse<T>>(`/api/mock/${resourceName}`)

      if (response.success) {
        items.value = response.data || []
        console.log(`✅ Loaded ${items.value.length} ${pluralName}`)
      }
    } catch (e: any) {
      error.value = e
      console.error(`❌ Error fetching ${resourceName}:`, e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new item
   */
  const create = async (data: Partial<T>): Promise<T | undefined> => {
    loading.value = true
    error.value = null
    try {
      const mergedData = mergeWithDefaults(data)
      const generatedId = generateId(mergedData)

      const requestBody = {
        ...mergedData,
        ...(generatedId ? { [idKey]: generatedId } : {})
      }

      const response = await $fetch<MutationResponse<T>>(`/api/mock/${resourceName}`, {
        method: 'POST',
        body: requestBody
      })

      if (response.success) {
        const displayVal = getDisplayValue(mergedData)
        console.log(`✅ ${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1).replace(/s$/, '')} "${displayVal}" created`)
        await fetch() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error(`❌ Error creating ${resourceName}:`, e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing item
   */
  const update = async (id: string | number, updates: Partial<T>): Promise<T | undefined> => {
    loading.value = true
    error.value = null
    try {
      const requestBody = {
        [idKey]: id,
        ...updates
      }

      const response = await $fetch<MutationResponse<T>>(`/api/mock/${resourceName}`, {
        method: 'POST',
        body: requestBody
      })

      if (response.success) {
        console.log(`✅ ${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1).replace(/s$/, '')} "${id}" updated`)
        await fetch() // Refresh list
        return response.data
      }
    } catch (e: any) {
      error.value = e
      console.error(`❌ Error updating ${resourceName}:`, e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete item by id
   */
  const delete_ = async (id: string | number): Promise<boolean | undefined> => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<DeleteResponse>(`/api/mock/${resourceName}/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        console.log(`✅ ${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1).replace(/s$/, '')} "${id}" deleted`)
        await fetch() // Refresh list
        return true
      }
    } catch (e: any) {
      error.value = e
      console.error(`❌ Error deleting ${resourceName}:`, e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Build return object with extensions
   */
  const baseReturn: AdminResourceReturn<T> = {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
    create,
    update,
    delete: delete_
  }

  /**
   * Apply extension methods
   */
  const extensionMethods = Object.entries(extensions).reduce(
    (acc, [name, fn]) => ({
      ...acc,
      [name]: (...args: any[]) => fn(items, ...args)
    }),
    {} as Record<string, any>
  )

  return { ...baseReturn, ...extensionMethods }
}
