<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AuthLayout - Layout for authentication pages
 * - Centered content
 * - Simple design
 * - No header/footer
 *
 * Features:
 * - Gradient background
 * - Centered card container
 * - Responsive design
 *
 * Usage:
 * <LayoutAuthLayout>
 *   <h1>Login</h1>
 *   <form>
 *     <!-- Form fields -->
 *   </form>
 * </LayoutAuthLayout>
 */
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: linear-gradient(
    135deg,
    var(--color-primary-lightest) 0%,
    var(--color-primary-lighter) 100%
  );
}

.auth-container {
  width: 100%;
  max-width: 28rem;
}

.auth-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .auth-layout {
    padding: var(--spacing-md);
  }

  .auth-card {
    padding: var(--spacing-lg);
  }
}
</style>
