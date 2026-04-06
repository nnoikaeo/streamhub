/**
 * Single source of truth for service mode detection.
 * Centralizes the useFirestore / useJsonMock flag logic
 * so every consumer uses the same evaluation.
 */
export function useServiceMode() {
  const config = useRuntimeConfig()

  const isFirestore = config.public.useFirestore === true || String(config.public.useFirestore) === 'true'
  const isMock = !isFirestore

  /**
   * Return the correct API base path for a given resource.
   * Firestore mode → `/api/{resource}`
   * Mock mode     → `/api/mock/{resource}`
   */
  const apiBase = (resource: string) => isFirestore ? `/api/${resource}` : `/api/mock/${resource}`

  return { isFirestore, isMock, apiBase }
}
