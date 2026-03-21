import type { Invitation } from '~/types/invitation'
import { useAdminResource } from './useAdminResource'

export function useAdminInvitations() {
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

  const fetchByCompany = async (company: string) => {
    const response = await $fetch<any>('/api/mock/invitations', {
      query: { company }
    })
    return response.data || []
  }

  const fetchByStatus = async (status: string) => {
    const response = await $fetch<any>('/api/mock/invitations', {
      query: { status }
    })
    return response.data || []
  }

  const cancelInvitation = async (id: string) => {
    return resource.update(id, { status: 'cancelled' as any })
  }

  const resendInvitation = async (id: string) => {
    return resource.update(id, {
      status: 'pending' as any,
      resend: true,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() as any
    } as any)
  }

  const bulkInvite = async (input: any) => {
    const response = await $fetch<any>('/api/mock/invitations/bulk', {
      method: 'POST',
      body: input
    })
    return response.data
  }

  const checkInvitation = async (email: string) => {
    const response = await $fetch<any>('/api/mock/invitations/check', {
      query: { email }
    })
    return response
  }

  const verifyInvitation = async (code: string) => {
    const response = await $fetch<any>('/api/mock/invitations/verify', {
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
    const response = await $fetch<any>('/api/mock/invitations/accept', {
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
    const response = await $fetch<any>('/api/mock/invitations/reactivate', {
      method: 'POST',
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
