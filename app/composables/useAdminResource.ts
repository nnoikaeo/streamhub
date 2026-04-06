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

import { readonly } from 'vue'
import type { Ref } from 'vue'
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

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

  // Firestore mode detection
  const { isFirestore: useFirestoreMode } = useServiceMode()

  // State management — useState shares state across all callers with the same key
  const items = useState<T[]>(`admin-resource-${resourceName}`, () => [])
  const loading = useState<boolean>(`admin-resource-${resourceName}-loading`, () => false)
  const error = useState<Error | null>(`admin-resource-${resourceName}-error`, () => null)

  /**
   * Get Authorization headers + uid query param for DEV fallback.
   * Enables server middleware to identify the user for company-based filtering.
   */
  const getAuthOptions = async (): Promise<{ headers: Record<string, string>; query: Record<string, string> }> => {
    const headers: Record<string, string> = {}
    const query: Record<string, string> = {}
    try {
      const { getIdToken } = useAuth()
      const token = await getIdToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // Auth may not be available (e.g., during SSR or before plugin init)
    }
    // DEV fallback: send uid in query param for server auth middleware
    // when Firebase Admin SDK credentials are not configured
    try {
      const authStore = useAuthStore()
      if (authStore.user?.uid) {
        query.uid = authStore.user.uid
      }
    } catch {
      // Store may not be available during SSR
    }
    return { headers, query }
  }

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
   * Convert Firestore Timestamps to ISO strings in a document
   */
  const convertTimestamps = (data: Record<string, any>): Record<string, any> => {
    const result = { ...data }
    for (const key of Object.keys(result)) {
      const value = result[key]
      if (value instanceof Timestamp) {
        result[key] = value.toDate().toISOString()
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = convertTimestamps(value)
      }
    }
    return result
  }

  /**
   * Fetch all items from Firestore (production mode)
   */
  const fetchFromFirestore = async () => {
    const { $firebase } = useNuxtApp()
    const db = ($firebase as any).db
    const snapshot = await getDocs(collection(db, resourceName))
    const docs = snapshot.docs.map(d => {
      const data = convertTimestamps(d.data())
      // Use document ID as the idKey if not present in data
      const idValue = data[idKey as string] ?? d.id
      return { ...data, [idKey]: idValue } as T
    })

    // Apply company-based filtering for non-admin users
    const authStore = useAuthStore()
    const userRole = authStore.user?.role
    const userCompany = authStore.user?.company
    if (userRole && userRole !== 'admin' && userCompany) {
      items.value = docs.filter(item => (item as any).company === userCompany)
    } else {
      items.value = docs
    }
  }

  /**
   * Fetch all items
   */
  const fetch = async () => {
    loading.value = true
    error.value = null
    try {
      if (useFirestoreMode) {
        await fetchFromFirestore()
        console.log(`✅ Loaded ${items.value.length} ${pluralName} from Firestore`)
        return
      }

      const { headers, query } = await getAuthOptions()
      const response = await $fetch<FetchResponse<T>>(`/api/mock/${resourceName}`, {
        headers,
        query,
      })

      if (response.success) {
        items.value = response.data || []
        console.log(`✅ Loaded ${items.value.length} ${pluralName}`)
      }
    } catch (e: any) {
      if (e?.response?.status === 403 || e?.statusCode === 403) {
        console.error(`🚫 Access denied fetching ${resourceName}:`, e.data?.message)
        try { useAppToast().showToast('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 'error') } catch {}
        items.value = []
        return
      }
      error.value = e
      console.error(`❌ Error fetching ${resourceName}:`, e.message)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get Firestore DB reference
   */
  const getFirestoreDb = () => {
    const { $firebase } = useNuxtApp()
    return ($firebase as any).db
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

      if (useFirestoreMode) {
        const db = getFirestoreDb()
        const docId = String(requestBody[idKey as string] || generatedId || `${idPrefix || ''}${Date.now()}`)
        const now = new Date().toISOString()
        const newItem = { ...requestBody, createdAt: now, updatedAt: now } as T
        await setDoc(doc(db, resourceName, docId), newItem)
        console.log(`✅ ${resourceName} "${docId}" created in Firestore`)
        await fetch()
        return newItem
      }

      const { headers, query } = await getAuthOptions()
      const response = await $fetch<MutationResponse<T>>(`/api/mock/${resourceName}`, {
        method: 'POST',
        body: requestBody,
        headers,
        query,
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
      if (useFirestoreMode) {
        const db = getFirestoreDb()
        const now = new Date().toISOString()
        const updateData = { ...updates, updatedAt: now }
        await updateDoc(doc(db, resourceName, String(id)), updateData)
        console.log(`✅ ${resourceName} "${id}" updated in Firestore`)
        await fetch()
        return { [idKey]: id, ...updateData } as T
      }

      const requestBody = {
        [idKey]: id,
        ...updates
      }

      const { headers, query } = await getAuthOptions()
      const response = await $fetch<MutationResponse<T>>(`/api/mock/${resourceName}/${id}`, {
        method: 'PUT',
        body: requestBody,
        headers,
        query,
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
      if (useFirestoreMode) {
        const db = getFirestoreDb()
        await deleteDoc(doc(db, resourceName, String(id)))
        console.log(`✅ ${resourceName} "${id}" deleted from Firestore`)
        await fetch()
        return true
      }

      const { headers, query } = await getAuthOptions()
      const response = await $fetch<DeleteResponse>(`/api/mock/${resourceName}/${id}`, {
        method: 'DELETE',
        headers,
        query,
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
    items: readonly(items) as unknown as Readonly<Ref<T[]>>,
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
