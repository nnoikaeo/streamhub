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
 * Thrown when a create/update would violate a uniqueness constraint.
 * Carries a user-facing (Thai) message that callers can surface directly.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * A field that must be unique across all items of a resource.
 * `field` is the property checked; `message` is shown to the user on a clash.
 * Comparison is case-insensitive and trims whitespace by default.
 */
interface UniqueFieldRule<T> {
  field: keyof T
  message: string
}

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
   * Skip company-based filtering when fetching. Set true for resources that
   * have no company field (folders, tags, groups) so moderators see all items.
   */
  skipCompanyFilter?: boolean

  /**
   * Custom extension methods for resource-specific utilities
   */
  extensions?: ResourceExtensions<T>

  /**
   * Plural name for console logs (defaults to resourceName + 's')
   */
  pluralName?: string

  /**
   * Fields that must be unique across all items. Checked on create and update
   * against the loaded list (no extra read). A clash throws a ValidationError
   * carrying the rule's message. Use for natural-key resources whose create
   * path would otherwise silently overwrite (e.g. company/region `code`) or for
   * secondary keys that are not the doc id (e.g. tag `slug`).
   */
  uniqueFields?: UniqueFieldRule<T>[]
}

/**
 * An extension method: takes the live item list, then its own arguments.
 *
 * The rest parameter is `never[]` rather than `unknown[]` so that a concrete
 * definition — `(folders, parentId: string | null) => Folder[]` — still
 * satisfies it; parameters are checked contravariantly.
 */
type ResourceExtension<T> = (items: Ref<T[]>, ...args: never[]) => unknown

/**
 * Extension methods that can be added to specific resources
 */
interface ResourceExtensions<T> {
  [methodName: string]: ResourceExtension<T>
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
export function useAdminResource<T extends object>(
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
    pluralName = resourceName.endsWith('s') ? resourceName : `${resourceName}s`,
    skipCompanyFilter = false,
    uniqueFields = []
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
    // Ids are strings or numbers everywhere; keep the original truthiness check
    // so a blank id still falls through to generation.
    if (existingId && (typeof existingId === 'string' || typeof existingId === 'number')) {
      return existingId
    }

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
  const convertTimestamps = (data: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data }
    for (const key of Object.keys(result)) {
      const value = result[key]
      if (value instanceof Timestamp) {
        result[key] = value.toDate().toISOString()
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = convertTimestamps(value as Record<string, unknown>)
      }
    }
    return result
  }

  /**
   * Fetch all items from Firestore (production mode)
   */
  const fetchFromFirestore = async () => {
    const { $firebase } = useNuxtApp()
    const db = $firebase.db
    const snapshot = await getDocs(collection(db, resourceName))
    const docs = snapshot.docs.map(d => {
      const data = convertTimestamps(d.data())
      // Use document ID as the idKey if not present in data
      const idValue = data[idKey as string] ?? d.id
      return { ...data, [idKey]: idValue } as T
    })

    // Apply company-based filtering for non-admin users (only for resources with a company field)
    const authStore = useAuthStore()
    const userRole = authStore.user?.role
    const userCompany = authStore.user?.company
    if (!skipCompanyFilter && userRole && userRole !== 'admin' && userCompany) {
      // `in` narrows T to a shape carrying the key — resources without a
      // company field simply never match, which is the intended behaviour
      items.value = docs.filter(item => 'company' in item && item.company === userCompany)
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
    } catch (e: unknown) {
      if (getErrorStatus(e) === 403) {
        console.error(`🚫 Access denied fetching ${resourceName}:`, getErrorDataMessage(e))
        try { useAppToast().showToast('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 'error') } catch { /* toast unavailable outside a component scope */ }
        items.value = []
        return
      }
      error.value = toError(e)
      console.error(`❌ Error fetching ${resourceName}:`, getErrorMessage(e))
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
    return $firebase.db
  }

  /**
   * Normalize a value for uniqueness comparison (trim + lowercase).
   */
  const normalizeUnique = (v: unknown): string => String(v ?? '').trim().toLowerCase()

  /**
   * Throw a ValidationError if `data` clashes with an existing item on any
   * configured unique field. On update, pass `excludeId` to skip the item
   * being edited. Fields absent/empty in `data` are ignored.
   */
  const assertUnique = (data: Partial<T>, excludeId?: string | number): void => {
    if (uniqueFields.length === 0) return
    for (const rule of uniqueFields) {
      const value = data[rule.field]
      if (value === undefined || value === null || value === '') continue
      const target = normalizeUnique(value)
      const clash = items.value.some(item => {
        if (excludeId !== undefined && String(item[idKey as keyof T]) === String(excludeId)) return false
        return normalizeUnique(item[rule.field]) === target
      })
      if (clash) throw new ValidationError(rule.message)
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
      assertUnique(mergedData)
      const generatedId = generateId(mergedData)

      const requestBody = {
        ...mergedData,
        ...(generatedId ? { [idKey]: generatedId } : {})
      }

      if (useFirestoreMode) {
        const db = getFirestoreDb()
        const docId = String(requestBody[idKey as string] || generatedId || `${idPrefix || ''}${Date.now()}`)
        const now = new Date().toISOString()
        const newItem = { ...requestBody, createdAt: now, updatedAt: now } as unknown as T
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
    } catch (e: unknown) {
      error.value = toError(e)
      // A ValidationError is expected user input (e.g. duplicate key), not a
      // system failure — log it quietly so it doesn't look like a crash.
      if (e instanceof ValidationError) {
        console.warn(`⚠️ ${resourceName} create blocked: ${getErrorMessage(e)}`)
      } else {
        console.error(`❌ Error creating ${resourceName}:`, getErrorMessage(e))
      }
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
      assertUnique(updates, id)
      if (useFirestoreMode) {
        const db = getFirestoreDb()
        const now = new Date().toISOString()
        const updateData = { ...updates, updatedAt: now }
        await updateDoc(doc(db, resourceName, String(id)), updateData)
        console.log(`✅ ${resourceName} "${id}" updated in Firestore`)
        await fetch()
        return { [idKey]: id, ...updateData } as unknown as T
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
    } catch (e: unknown) {
      error.value = toError(e)
      console.error(`❌ Error updating ${resourceName}:`, getErrorMessage(e))
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
    } catch (e: unknown) {
      error.value = toError(e)
      console.error(`❌ Error deleting ${resourceName}:`, getErrorMessage(e))
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
      [name]: (...args: never[]) => fn(items, ...args)
    }),
    {} as Record<string, (...args: never[]) => unknown>
  )

  return { ...baseReturn, ...extensionMethods }
}
