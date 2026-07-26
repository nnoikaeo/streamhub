import { getAdminDb, isFirestoreMode } from './firestoreAdmin'
import { findById } from './jsonDatabase'
import type { User } from '~/types/dashboard'

/**
 * Resolve a full user record by uid across both data sources.
 *
 * Firestore mode (production) reads the `users` collection; JSON mode
 * (dev / mock) reads users.json. Returns null when the user is unknown or
 * Firestore is unavailable.
 */
export async function resolveUser(uid: string): Promise<User | null> {
  if (isFirestoreMode()) {
    try {
      const db = getAdminDb()
      if (!db) return null
      const doc = await db.collection('users').doc(uid).get()
      if (!doc.exists) return null
      return { id: doc.id, ...(doc.data() as any) } as User
    } catch {
      return null
    }
  }

  return await findById<User>('users.json', uid)
}

/**
 * Resolve a user's role by uid across both data sources.
 * Returns null when the user is unknown — callers should treat null as
 * "not authorized".
 */
export async function resolveUserRole(uid: string): Promise<string | null> {
  const user = await resolveUser(uid)
  return user?.role ?? null
}
