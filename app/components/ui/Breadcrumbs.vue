<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol class="breadcrumbs__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumbs__item"
      >
        <NuxtLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="breadcrumbs__link"
        >
          <span v-if="item.icon" class="breadcrumbs__icon">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
        <span v-else class="breadcrumbs__current">
          <span v-if="item.icon" class="breadcrumbs__icon">{{ item.icon }}</span>
          {{ item.label }}
        </span>
        <span v-if="index < items.length - 1" class="breadcrumbs__separator">/</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script>

<style scoped>
.breadcrumbs {
  padding: var(--spacing-md) 0;
}

.breadcrumbs__list {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
}

.breadcrumbs__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.breadcrumbs__link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color var(--transition-fast);
}

.breadcrumbs__link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.breadcrumbs__current {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
}

.breadcrumbs__separator {
  color: var(--color-border-default);
  margin: 0 var(--spacing-xs);
  font-weight: 300;
}

.breadcrumbs__icon {
  display: inline-flex;
  line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .breadcrumbs {
    padding: var(--spacing-sm) 0;
  }

  .breadcrumbs__link,
  .breadcrumbs__current {
    font-size: 0.75rem;
  }
}
</style>
