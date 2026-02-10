<template>
  <footer class="app-footer-content">
    <div class="footer-container">
      <p class="footer-text">© 2026 Streamwash (THAILAND) Co.Ltd. All rights reserved.</p>
      <nav class="footer-links">
        <a href="#" class="footer-link">Terms</a>
        <a href="#" class="footer-link">Privacy</a>
        <a href="#" class="footer-link">Contact</a>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
/**
 * AppFooter - Main application footer
 * Used by AppLayout component
 */
</script>

<style scoped>
.app-footer-content {
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-light);
  min-height: 2rem;
}

.footer-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1.5rem;
  gap: 1rem;
}

.footer-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-text-primary);
    text-decoration: underline;
  }
}
</style>
