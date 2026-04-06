import type { Invitation } from '~/types/invitation'
import { useAdminResource } from './useAdminResource'

export function useAdminInvitations() {
  const { isFirestore: useFirestore, apiBase: getApiBase } = useServiceMode()
  const apiBase = getApiBase('invitations')

  const resource = useAdminResource<Invitation>({
    resourceName: 'invitations',
    idKey: 'id',
    displayKey: 'email',
    idPrefix: 'inv_',
    defaults: {
      status: 'pending' as any,
      assignedFolders: [],
      assignedGroups: []
    }
  })

  const invitations = resource.items
  const fetchInvitations = resource.fetch

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { getIdToken } = useAuth()
      const token = await getIdToken()
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const fetchByCompany = async (company: string) => {
    const headers = await getAuthHeaders()
    const response = await $fetch<any>(apiBase, {
      query: { company },
      headers
    })
    return response.data || []
  }

  const fetchByStatus = async (status: string) => {
    const headers = await getAuthHeaders()
    const response = await $fetch<any>(apiBase, {
      query: { status },
      headers
    })
    return response.data || []
  }

  const cancelInvitation = async (id: string, performedBy?: string, performedByEmail?: string) => {
    const headers = await getAuthHeaders()
    await $fetch<any>(`${apiBase}/${id}`, {
      method: 'PUT',
      headers,
      body: {
        status: 'cancelled',
        performedBy: performedBy || 'system',
        performedByEmail: performedByEmail || 'System'
      }
    })
    await resource.fetch()
  }

  const resendInvitation = async (id: string, performedBy?: string, performedByEmail?: string) => {
    const headers = await getAuthHeaders()
    const response = await $fetch<any>(`${apiBase}/${id}`, {
      method: 'PUT',
      headers,
      body: {
        status: 'pending',
        resend: true,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: performedBy || 'system',
        performedByEmail: performedByEmail || 'System'
      }
    })
    await resource.fetch()
    return { emailSent: response?.emailSent === true }
  }

  const bulkInvite = async (input: any) => {
    const headers = await getAuthHeaders()
    const response = await $fetch<any>(`${apiBase}/bulk`, {
      method: 'POST',
      headers,
      body: input
    })
    return response.data
  }

  const checkInvitation = async (email: string) => {
    const response = await $fetch<any>(`${apiBase}/check`, {
      query: { email }
    })
    return response
  }

  const verifyInvitation = async (code: string) => {
    const response = await $fetch<any>(`${apiBase}/verify`, {
      query: { code }
    })
    return response
  }

  const acceptInvitation = async (data: {
    invitationCode: string
    uid: string
    email: string
    displayName: string
    photoURL?: string
  }) => {
    const response = await $fetch<any>(`${apiBase}/accept`, {
      method: 'POST',
      body: data
    })
    return response
  }

  const reactivateUser = async (data: {
    email: string
    role: string
    company: string
    groups?: string[]
  }) => {
    const headers = await getAuthHeaders()
    const response = await $fetch<any>(`${apiBase}/reactivate`, {
      method: 'POST',
      headers,
      body: data
    })
    return response
  }

  return {
    invitations,
    fetchInvitations,
    ...resource,
    fetchByCompany,
    fetchByStatus,
    cancelInvitation,
    resendInvitation,
    bulkInvite,
    checkInvitation,
    verifyInvitation,
    acceptInvitation,
    reactivateUser
  }
}
