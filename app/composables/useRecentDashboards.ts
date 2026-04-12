/**
 * Recent Dashboards Composable
 *
 * Tracks dashboards a user has actually visited, stored in localStorage per user.
 * Replaces the previous approach of sorting by updatedAt (last modified).
 *
 * Storage key: streamhub:recent:{userId}
 * Stores up to MAX_ENTRIES entries, sorted newest-visit-first.
 */

const MAX_ENTRIES = 10
const STORAGE_KEY_PREFIX = 'streamhub:recent:'

interface RecentEntry {
  id: string
  name: string
  lastVisited: string // ISO string
}

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`
}

function readEntries(userId: string): RecentEntry[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as RecentEntry[]
  } catch {
    return []
  }
}

function writeEntries(userId: string, entries: RecentEntry[]): void {
  if (import.meta.server) return
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(entries))
  } catch {
    // localStorage quota exceeded or unavailable — silently ignore
  }
}

export function useRecentDashboards() {
  /**
   * Record a dashboard visit for the current user.
   * Moves the entry to the top if already present, otherwise prepends it.
   */
  function recordVisit(userId: string, dashboardId: string, dashboardName: string): void {
    if (!userId || !dashboardId) return

    const entries = readEntries(userId).filter(e => e.id !== dashboardId)

    entries.unshift({
      id: dashboardId,
      name: dashboardName,
      lastVisited: new Date().toISOString(),
    })

    writeEntries(userId, entries.slice(0, MAX_ENTRIES))
  }

  /**
   * Get recent dashboards for the current user, newest-first.
   */
  function getRecentDashboards(
    userId: string,
    limit = 5,
  ): Array<{ id: string; name: string; lastAccessed: string }> {
    if (!userId) return []
    return readEntries(userId)
      .slice(0, limit)
      .map(e => ({ id: e.id, name: e.name, lastAccessed: e.lastVisited }))
  }

  return { recordVisit, getRecentDashboards }
}
