<template>
  <div class="quick-actions">
    <h2 class="quick-actions__title">Quick Actions</h2>
    
    <div class="quick-actions__grid">
      <button class="action-button" @click="$emit('view-dashboards')">
        <span class="action-button__icon">👁️</span>
        <span class="action-button__text">View Dashboards</span>
      </button>

      <button
        v-if="canCreate"
        class="action-button action-button--primary"
        @click="$emit('create-dashboard')"
      >
        <span class="action-button__icon">➕</span>
        <span class="action-button__text">Create Dashboard</span>
      </button>

      <button
        v-if="canShare"
        class="action-button"
        @click="$emit('share-dashboard')"
      >
        <span class="action-button__icon">🔗</span>
        <span class="action-button__text">Share</span>
      </button>

      <button
        v-if="canInvite"
        class="action-button"
        @click="$emit('invite-user')"
      >
        <span class="action-button__icon">✉️</span>
        <span class="action-button__text">Invite User</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canCreate?: boolean
  canShare?: boolean
  canInvite?: boolean
}>()

defineEmits<{
  'view-dashboards': []
  'create-dashboard': []
  'share-dashboard': []
  'invite-user': []
}>()
</script>

<style scoped>
.quick-actions {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.quick-actions__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.quick-actions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: inherit;
}

.action-button:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.action-button:active {
  transform: translateY(0);
}

.action-button--primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-button--primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.action-button__icon {
  font-size: 2rem;
  line-height: 1;
}

.action-button__text {
  font-size: 0.875rem;
  font-weight: 500;
}

.action-button--primary .action-button__text {
  color: white;
}
</style>
