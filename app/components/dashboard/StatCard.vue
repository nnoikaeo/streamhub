<template>
  <div class="stat-card">
    <div class="stat-card__icon">{{ icon }}</div>
    <div class="stat-card__content">
      <h3 class="stat-card__title">{{ title }}</h3>
      <p v-if="count !== undefined" class="stat-card__value">{{ count }}</p>
      <p v-else-if="value" class="stat-card__value">{{ value }}</p>
    </div>
    <NuxtLink
      v-if="link"
      :to="link"
      class="stat-card__link"
    >
      View →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  count?: number
  value?: string
  icon: string
  link?: string
}>()
</script>

<style scoped>
.stat-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: relative;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-lighter);
}

.stat-card__icon {
  font-size: 2rem;
  line-height: 1;
}

.stat-card__content {
  flex: 1;
}

.stat-card__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.stat-card__link {
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.stat-card__link:hover {
  color: var(--color-primary-dark);
}
</style>
