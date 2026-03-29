/**
 * Seed Firestore with Mock JSON Data
 *
 * Reads .data/*.json files and imports them into Firestore collections.
 * Uses Firebase Admin SDK (service account required).
 *
 * Usage:
 *   npx tsx scripts/seed-firestore.ts
 *
 * Env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — inline JSON service account
 *   GOOGLE_APPLICATION_CREDENTIALS — file path to service account JSON
 *
 * Options:
 *   --dry-run   Print what would be imported without writing to Firestore
 *   --clean     Delete existing documents before seeding
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ============================================================================
// LOAD .env.local (script runs outside Nuxt, so we load it manually)
// ============================================================================

const ROOT_DIR = resolve(import.meta.dirname || __dirname, '..')
const envLocalPath = resolve(ROOT_DIR, '.env.local')

if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    // Don't overwrite existing env vars (CLI takes priority)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
  console.log('📄 Loaded .env.local')
}

// ============================================================================
// CONFIG
// ============================================================================

const DATA_DIR = resolve(ROOT_DIR, '.data')

/** Map of collection name → { file, idField } */
const COLLECTIONS: Record<string, { file: string; idField: string }> = {
  users: { file: 'users.json', idField: 'uid' },
  dashboards: { file: 'dashboards.json', idField: 'id' },
  folders: { file: 'folders.json', idField: 'id' },
  companies: { file: 'companies.json', idField: 'code' },
  regions: { file: 'regions.json', idField: 'code' },
  groups: { file: 'groups.json', idField: 'id' },
  invitations: { file: 'invitations.json', idField: 'id' },
  tags: { file: 'tags.json', idField: 'id' },
}

// ============================================================================
// HELPERS
// ============================================================================

/** Convert ISO date strings in a document to Firestore Timestamps */
function convertDatesToTimestamps(obj: Record<string, any>): Record<string, any> {
  const result = { ...obj }
  const dateFields = [
    'createdAt', 'updatedAt', 'lastLogin', 'expiresAt',
    'acceptedAt', 'archivedAt', 'timestamp',
  ]

  for (const key of Object.keys(result)) {
    const value = result[key]
    if (dateFields.includes(key) && typeof value === 'string') {
      result[key] = Timestamp.fromDate(new Date(value))
    } else if (key === 'expiry' && value && typeof value === 'object') {
      // Convert expiry map values to Timestamps
      const expiryMap: Record<string, any> = {}
      for (const [uid, dateStr] of Object.entries(value)) {
        if (typeof dateStr === 'string') {
          expiryMap[uid] = Timestamp.fromDate(new Date(dateStr))
        } else {
          expiryMap[uid] = dateStr
        }
      }
      result[key] = expiryMap
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertDatesToTimestamps(value)
    }
  }

  return result
}

function loadJsonFile(filename: string): any[] {
  const filePath = resolve(DATA_DIR, filename)
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const clean = args.includes('--clean')

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey)
      initializeApp({ credential: cert(serviceAccount) })
    } else if (credentialsPath) {
      initializeApp()
    } else {
      console.error('❌ No Firebase credentials found.')
      console.error('   Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS')
      process.exit(1)
    }
  }

  const db = getFirestore()

  console.log(`\n🔥 Firestore Seed Script`)
  console.log(`   Data dir: ${DATA_DIR}`)
  if (dryRun) console.log('   ⚠️  DRY RUN — no writes will be performed\n')
  if (clean) console.log('   🗑️  CLEAN MODE — existing docs will be deleted first\n')

  let totalDocs = 0

  for (const [collectionName, config] of Object.entries(COLLECTIONS)) {
    try {
      const documents = loadJsonFile(config.file)
      console.log(`\n📂 ${collectionName} (${documents.length} documents from ${config.file})`)

      // Clean existing documents if requested
      if (clean && !dryRun) {
        const existing = await db.collection(collectionName).listDocuments()
        if (existing.length > 0) {
          const batch = db.batch()
          for (const docRef of existing) {
            batch.delete(docRef)
          }
          await batch.commit()
          console.log(`   🗑️  Deleted ${existing.length} existing documents`)
        }
      }

      // Seed documents in batches of 500 (Firestore batch limit)
      const BATCH_SIZE = 500
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const chunk = documents.slice(i, i + BATCH_SIZE)

        if (!dryRun) {
          const batch = db.batch()

          for (const rawDoc of chunk) {
            const docId = rawDoc[config.idField]
            if (!docId) {
              console.warn(`   ⚠️  Skipping document without ${config.idField}:`, rawDoc)
              continue
            }

            // Convert dates to Timestamps and remove the id field from the stored data
            const docData = convertDatesToTimestamps({ ...rawDoc })
            // Keep the id field as-is for documents that store it (e.g., id, uid, code)
            // Firestore document ID is set separately

            const ref = db.collection(collectionName).doc(String(docId))
            batch.set(ref, docData)
          }

          await batch.commit()
        }

        for (const rawDoc of chunk) {
          const docId = rawDoc[config.idField]
          if (docId) {
            console.log(`   ✅ ${docId}`)
          }
        }
      }

      totalDocs += documents.length
    } catch (error: any) {
      console.error(`   ❌ Error seeding ${collectionName}: ${error.message}`)
    }
  }

  console.log(`\n🎉 Done! ${totalDocs} documents ${dryRun ? 'would be' : ''} seeded.`)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
