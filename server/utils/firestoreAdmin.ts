/**
 * Firebase Admin Firestore Utility
 *
 * Provides server-side Firestore access using the Admin SDK.
 * Used by mock API handlers when NUXT_PUBLIC_USE_FIRESTORE=true so that
 * data is read/written from Firestore instead of local JSON files.
 */

import { getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { Firestore } from 'firebase-admin/firestore'

export function isFirestoreMode(): boolean {
  return process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true'
}

/**
 * Get an Admin Firestore instance.
 * Requires Firebase Admin to already be initialized (done by auth.ts middleware).
 * Returns null if Admin SDK is not available (e.g., local dev without credentials).
 */
export function getAdminDb(): Firestore | null {
  const apps = getApps()
  if (apps.length === 0) return null
  return getFirestore(apps[0]!)
}

/**
 * Read all documents from a Firestore collection.
 * Returns an empty array if the collection is empty or Admin SDK is unavailable.
 */
export async function fsReadAll<T extends Record<string, any>>(
  db: Firestore,
  collection: string
): Promise<T[]> {
  const snap = await db.collection(collection).get()
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as T)
}

/**
 * Query documents from a Firestore collection by a single field value.
 */
export async function fsQuery<T extends Record<string, any>>(
  db: Firestore,
  collection: string,
  field: string,
  value: any
): Promise<T[]> {
  const snap = await db.collection(collection).where(field, '==', value).get()
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as T)
}

/**
 * Create or overwrite a document by ID.
 */
export async function fsSet(
  db: Firestore,
  collection: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  await db.collection(collection).doc(id).set(data)
}

/**
 * Update fields of an existing document.
 */
export async function fsUpdate(
  db: Firestore,
  collection: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  await db.collection(collection).doc(id).update({ ...data, updatedAt: new Date().toISOString() })
}
