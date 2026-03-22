import { ref, readonly } from 'vue'

export interface LookerReport {
  id: string
  title: string
  owner: string
  lastModified: string
  createTime: string
  embedUrl: string
}

/**
 * Composable for interacting with Looker Studio API endpoints
 * Provides report browsing, search, and sync capabilities
 */
export function useLookerApi() {
  const enabled = ref(false)
  const reports = ref<LookerReport[]>([])
  const loading = ref(false)

  /** Check if Looker API is available */
  const checkStatus = async () => {
    try {
      const response = await $fetch<{ enabled: boolean }>('/api/looker/status')
      enabled.value = response.enabled
      return response.enabled
    } catch {
      enabled.value = false
      return false
    }
  }

  /** Search reports */
  const searchReports = async (query?: string) => {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: LookerReport[] }>('/api/looker/reports', {
        query: query ? { q: query } : undefined,
      })
      reports.value = response.data || []
      return reports.value
    } catch {
      reports.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /** Get single report metadata */
  const getReport = async (reportId: string) => {
    try {
      const response = await $fetch<{ success: boolean; data: LookerReport }>(`/api/looker/reports/${reportId}`)
      return response.data
    } catch {
      return null
    }
  }

  /** Sync Looker reports with local dashboards */
  const syncReports = async () => {
    loading.value = true
    try {
      const response = await $fetch<{
        success: boolean
        totalReports: number
        syncedDashboards: number
      }>('/api/looker/sync', { method: 'POST' })
      return response
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    enabled: readonly(enabled),
    reports: readonly(reports),
    loading: readonly(loading),
    checkStatus,
    searchReports,
    getReport,
    syncReports,
  }
}
