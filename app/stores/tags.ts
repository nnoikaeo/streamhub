import { defineStore } from 'pinia'
import type { Tag } from '~/types/tag'

export const useTagStore = defineStore('tags', () => {
  // ========== State ==========
  const tags = ref<Tag[]>([])
  const selectedTagIds = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ========== Computed - Getters ==========

  const activeTags = computed(() => tags.value.filter((t) => t.isActive))

  const getTagById = (id: string): Tag | undefined => {
    return tags.value.find((t) => t.id === id)
  }

  const getTagsByIds = (ids: string[]): Tag[] => {
    return ids.map((id) => tags.value.find((t) => t.id === id)).filter(Boolean) as Tag[]
  }

  const isTagSelected = (tagId: string): boolean => {
    return selectedTagIds.value.includes(tagId)
  }

  // ========== Actions ==========

  const setTags = (newTags: Tag[]) => {
    tags.value = newTags
  }

  const addTag = (tag: Tag) => {
    tags.value.push(tag)
  }

  const updateTag = (id: string, data: Partial<Tag>) => {
    const index = tags.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tags.value[index] = { ...tags.value[index], ...data }
    }
  }

  const removeTag = (id: string) => {
    tags.value = tags.value.filter((t) => t.id !== id)
  }

  const toggleTagFilter = (tagId: string) => {
    const index = selectedTagIds.value.indexOf(tagId)
    if (index === -1) {
      selectedTagIds.value.push(tagId)
    } else {
      selectedTagIds.value.splice(index, 1)
    }
  }

  const clearTagFilter = () => {
    selectedTagIds.value = []
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMsg: string | null) => {
    error.value = errorMsg
  }

  return {
    // State
    tags,
    selectedTagIds,
    isLoading,
    error,

    // Getters
    activeTags,
    getTagById,
    getTagsByIds,
    isTagSelected,

    // Actions
    setTags,
    addTag,
    updateTag,
    removeTag,
    toggleTagFilter,
    clearTagFilter,
    setLoading,
    setError,
  }
})
