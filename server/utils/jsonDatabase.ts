/**
 * JSON Database Utility
 * Provides CRUD operations for JSON files in .data/ directory
 *
 * Usage:
 * import { readJSON, createItem, updateItem, deleteItem } from '~/server/utils/jsonDatabase'
 *
 * const users = readJSON<User>('users.json')
 * const newUser = createItem('users.json', { uid: 'new_id', ... })
 * const updated = updateItem('users.json', 'user_id', { name: 'New Name' })
 */

import { promises as fs } from 'fs'
import { resolve } from 'path'

// Resolve path to .data directory
const DATA_DIR = resolve(process.cwd(), '.data')

/**
 * Read entire JSON file
 * @param filename - Name of file in .data/ directory (e.g., 'users.json')
 * @returns Array of items from JSON file
 * @throws Error if file not found or invalid JSON
 */
export async function readJSON<T>(filename: string): Promise<T[]> {
  try {
    const filepath = resolve(DATA_DIR, filename)
    const data = await fs.readFile(filepath, 'utf-8')

    // Handle empty files
    if (!data.trim()) {
      return []
    }

    const parsed = JSON.parse(data)

    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn(`[jsonDatabase] ${filename} is not an array, returning wrapped value`)
      return [parsed]
    }

    return parsed as T[]
  } catch (error) {
    if ((error as any)?.code === 'ENOENT') {
      console.error(`[jsonDatabase] File not found: ${filename}`)
      throw new Error(`File not found: ${filename}`)
    }

    if (error instanceof SyntaxError) {
      console.error(`[jsonDatabase] Invalid JSON in ${filename}:`, error.message)
      throw new Error(`Invalid JSON in ${filename}: ${error.message}`)
    }

    throw error
  }
}

/**
 * Write entire array to JSON file
 * @param filename - Name of file in .data/ directory
 * @param data - Array of items to write
 * @throws Error if write fails
 */
export async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
  try {
    const filepath = resolve(DATA_DIR, filename)

    // Validate data is array
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array')
    }

    // Format JSON with 2-space indentation
    const jsonString = JSON.stringify(data, null, 2)

    await fs.writeFile(filepath, jsonString, 'utf-8')
    console.log(`[jsonDatabase] Wrote ${data.length} items to ${filename}`)
  } catch (error) {
    console.error(`[jsonDatabase] Error writing to ${filename}:`, error)
    throw error
  }
}

/**
 * Find item by ID
 * @param filename - Name of JSON file
 * @param id - ID to search for (checks 'id' or 'uid' field)
 * @returns Item if found, null otherwise
 */
export async function findById<T extends Record<string, any>>(
  filename: string,
  id: string
): Promise<T | null> {
  try {
    const items = await readJSON<T>(filename)

    // Check for 'id' field first, then 'uid'
    const item = items.find((item) => {
      return item.id === id || item.uid === id || item.code === id
    })

    return item || null
  } catch (error) {
    console.error(`[jsonDatabase] Error finding item in ${filename}:`, error)
    throw error
  }
}

/**
 * Find items matching a filter
 * @param filename - Name of JSON file
 * @param filter - Function to filter items
 * @returns Array of matching items
 */
export async function findMany<T extends Record<string, any>>(
  filename: string,
  filter: (item: T) => boolean
): Promise<T[]> {
  try {
    const items = await readJSON<T>(filename)
    return items.filter(filter)
  } catch (error) {
    console.error(`[jsonDatabase] Error finding items in ${filename}:`, error)
    throw error
  }
}

/**
 * Create new item (adds to array)
 * @param filename - Name of JSON file
 * @param item - New item to add
 * @returns The created item
 * @throws Error if item already exists or write fails
 */
export async function createItem<T extends Record<string, any>>(
  filename: string,
  item: T
): Promise<T> {
  try {
    // Validate item has ID
    const id = item.id || item.uid || item.code
    if (!id) {
      throw new Error('Item must have id, uid, or code field')
    }

    const items = await readJSON<T>(filename)

    // Check if item already exists
    const exists = items.some((i) => i.id === id || i.uid === id || i.code === id)
    if (exists) {
      throw new Error(`Item with ID "${id}" already exists`)
    }

    // Add timestamps if not present
    const now = new Date().toISOString()
    const newItem = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }

    items.push(newItem as T)
    await writeJSON(filename, items)

    console.log(`[jsonDatabase] Created item in ${filename}:`, id)
    return newItem as T
  } catch (error) {
    console.error(`[jsonDatabase] Error creating item in ${filename}:`, error)
    throw error
  }
}

/**
 * Update existing item
 * @param filename - Name of JSON file
 * @param id - ID of item to update
 * @param updates - Partial object with fields to update
 * @returns Updated item, or null if not found
 * @throws Error if update fails
 */
export async function updateItem<T extends Record<string, any>>(
  filename: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  try {
    const items = await readJSON<T>(filename)

    const index = items.findIndex((item) => {
      return item.id === id || item.uid === id || item.code === id
    })

    if (index === -1) {
      return null
    }

    // Update item and set updatedAt
    const now = new Date().toISOString()
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: now,
    }

    await writeJSON(filename, items)

    console.log(`[jsonDatabase] Updated item in ${filename}:`, id)
    return items[index]
  } catch (error) {
    console.error(`[jsonDatabase] Error updating item in ${filename}:`, error)
    throw error
  }
}

/**
 * Delete item by ID
 * @param filename - Name of JSON file
 * @param id - ID of item to delete
 * @returns true if deleted, false if not found
 * @throws Error if delete fails
 */
export async function deleteItem(
  filename: string,
  id: string
): Promise<boolean> {
  try {
    const items = await readJSON(filename)

    const originalLength = items.length
    const filtered = items.filter((item: any) => {
      return item.id !== id && item.uid !== id && item.code !== id
    })

    if (filtered.length === originalLength) {
      // Item not found
      return false
    }

    await writeJSON(filename, filtered)
    console.log(`[jsonDatabase] Deleted item from ${filename}:`, id)
    return true
  } catch (error) {
    console.error(`[jsonDatabase] Error deleting item from ${filename}:`, error)
    throw error
  }
}

/**
 * Count items in file
 * @param filename - Name of JSON file
 * @returns Number of items
 */
export async function count(filename: string): Promise<number> {
  try {
    const items = await readJSON(filename)
    return items.length
  } catch (error) {
    console.error(`[jsonDatabase] Error counting items in ${filename}:`, error)
    throw error
  }
}

/**
 * Clear all items from file (empty array)
 * @param filename - Name of JSON file
 */
export async function clear(filename: string): Promise<void> {
  try {
    await writeJSON(filename, [])
    console.log(`[jsonDatabase] Cleared ${filename}`)
  } catch (error) {
    console.error(`[jsonDatabase] Error clearing ${filename}:`, error)
    throw error
  }
}

/**
 * List all files in .data directory
 * @returns Array of filenames
 */
export async function listFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(DATA_DIR)
    return files.filter((f) => f.endsWith('.json'))
  } catch (error) {
    console.error('[jsonDatabase] Error listing files:', error)
    throw error
  }
}
