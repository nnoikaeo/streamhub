<template>
  <footer class="app-footer-content">
    <div class="footer-container">
      <p class="footer-text">© 2025 StreamHub. All rights reserved.</p>
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
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  min-height: 3rem;
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
  color: #6b7280;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #1f2937;
    text-decoration: underline;
  }
}
</style>
