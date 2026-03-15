/**
 * Admin Regions Management Composable
 *
 * Wrapper around the generic useAdminResource composable for managing regions
 *
 * Usage:
 * const { regions, loading, fetchRegions, createRegion, updateRegion, deleteRegion } = useAdminRegions()
 */

import { useAdminResource } from './useAdminResource'
import type { Region } from '~/types/admin'

export function useAdminRegions() {
  const resource = useAdminResource<Region>({
    resourceName: 'regions',
    idKey: 'code',
    displayKey: 'name',
    defaults: {
      isActive: true
    }
  })

  return {
    regions: resource.items,
    fetchRegions: resource.fetch,
    createRegion: resource.create,
    updateRegion: resource.update,
    deleteRegion: resource.delete,

    // Also expose generic API for flexibility
    ...resource
  }
}
