import { google } from 'googleapis'
import type { H3Event } from 'h3'

let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null

/**
 * Get or create Google Auth client for Looker Studio API
 */
async function getAuthClient(event: H3Event) {
  if (authClient) return authClient

  const config = useRuntimeConfig(event)
  const inlineKey = config.googleServiceAccountKey
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!inlineKey && !credentialsPath) {
    return null
  }

  try {
    if (inlineKey) {
      const key = JSON.parse(inlineKey)
      authClient = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/datastudio.readonly'],
      })
    } else {
      authClient = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/datastudio.readonly'],
      })
    }
    return authClient
  } catch (error) {
    console.error('[LookerAPI] Auth setup failed:', error)
    return null
  }
}

export interface LookerReport {
  id: string
  title: string
  owner: string
  lastModified: string
  createTime: string
  embedUrl: string
}

/**
 * Search Looker Studio reports accessible by the service account
 */
export async function searchLookerReports(
  event: H3Event,
  query?: string,
): Promise<LookerReport[]> {
  const auth = await getAuthClient(event)
  if (!auth) return []

  try {
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) {
      console.error('[LookerAPI] Failed to get access token')
      return []
    }

    const url = 'https://lookerstudio.googleapis.com/v1/assets:search'
    const params: Record<string, string> = {
      assetTypes: 'REPORT',
    }
    if (query) {
      params.title = query
    }

    const response = await $fetch<{ assets?: Array<Record<string, unknown>> }>(url, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
      },
      query: params,
    })

    const assets = response.assets || []

    return assets.map((asset) => {
      const assetId = typeof asset.name === 'string' ? asset.name.split('/').pop() || '' : ''
      return {
        id: assetId,
        title: (asset.title as string) || 'Untitled',
        owner: (asset.owner as string) || '',
        lastModified: (asset.updateTime as string) || '',
        createTime: (asset.createTime as string) || '',
        embedUrl: `https://lookerstudio.google.com/embed/reporting/${assetId}`,
      }
    })
  } catch (error) {
    console.error('[LookerAPI] Search failed:', error)
    return []
  }
}

/**
 * Get metadata for a single Looker Studio report
 */
export async function getLookerReport(
  event: H3Event,
  reportId: string,
): Promise<LookerReport | null> {
  const auth = await getAuthClient(event)
  if (!auth) return null

  try {
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    if (!accessToken.token) return null

    const url = `https://lookerstudio.googleapis.com/v1/assets/${reportId}`

    const asset = await $fetch<Record<string, unknown>>(url, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
      },
    })

    return {
      id: reportId,
      title: (asset.title as string) || 'Untitled',
      owner: (asset.owner as string) || '',
      lastModified: (asset.updateTime as string) || '',
      createTime: (asset.createTime as string) || '',
      embedUrl: `https://lookerstudio.google.com/embed/reporting/${reportId}`,
    }
  } catch (error) {
    console.error('[LookerAPI] Get report failed:', error)
    return null
  }
}

/**
 * Check if Looker API is configured and available
 */
export function isLookerApiEnabled(event: H3Event): boolean {
  const config = useRuntimeConfig(event)
  return !!(config.googleServiceAccountKey || process.env.GOOGLE_APPLICATION_CREDENTIALS)
}
