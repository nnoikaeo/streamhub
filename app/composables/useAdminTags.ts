import { useAdminResource } from './useAdminResource'
import { useTagStore } from '~/stores/tags'
import type { Tag } from '~/types/tag'

export function useAdminTags() {
  const tagStore = useTagStore()

  const resource = useAdminResource<Tag>({
    resourceName: 'tags',
    idKey: 'id',
    displayKey: 'name',
    idPrefix: 'tag_',
    defaults: {
      isActive: true
    }
  })

  const fetchTags = async () => {
    await resource.fetch()
    tagStore.setTags([...resource.items.value])
  }

  const createTag = async (data: Partial<Tag>) => {
    const result = await resource.create(data)
    if (result) tagStore.addTag(result)
    return result
  }

  const updateTag = async (id: string, data: Partial<Tag>) => {
    const result = await resource.update(id, data)
    if (result) tagStore.updateTag(id, data)
    return result
  }

  const deleteTag = async (id: string) => {
    const result = await resource.delete(id)
    if (result) tagStore.removeTag(id)
    return result
  }

  return {
    tags: resource.items,
    loading: resource.loading,
    error: resource.error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  }
}
