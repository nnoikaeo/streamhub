<script setup lang="ts">
/**
 * AdminPageContent Component
 *
 * Shared layout wrapper for all admin management pages.
 * Provides consistent structure and scoped styles across admin pages
 * such as /admin/companies, /admin/folders, /admin/users, etc.
 *
 * Slots:
 * - #header  → Page title + primary action button (inside .page-header)
 * - #filters → Filter inputs and clear button (inside .filters-section > .filters-row)
 *              Use <div class="filter-group"> for each input — styled via :slotted()
 * - #table   → DataTable component (inside .table-section)
 * - default  → Modals and dialogs (teleported to body, position in DOM is irrelevant)
 *
 * Usage:
 * <AdminPageContent>
 *   <template #header>
 *     <h1 class="page-header__title">Page Title</h1>
 *     <button class="page-header-action-btn">Add New</button>
 *   </template>
 *
 *   <template #filters>
 *     <div class="filter-group"><input ... /></div>
 *     <div class="filter-group"><select ... /></div>
 *     <button class="theme-btn theme-btn--ghost">Clear</button>
 *   </template>
 *
 *   <template #table>
 *     <DataTable ... />
 *   </template>
 *
 *   <FormModal ... />
 *   <ConfirmDialog ... />
 * </AdminPageContent>
 */
</script>

<template>
  <div class="admin-content">
    <!-- Page Header: title + primary action button -->
    <div class="page-header">
      <slot name="header" />
    </div>

    <!-- Filters Section: search, status filter, clear button -->
    <div class="filters-section">
      <div class="filters-row">
        <slot name="filters" />
      </div>
    </div>

    <!-- Table Section: DataTable -->
    <div class="table-section">
      <slot name="table" />
    </div>

    <!-- Default slot: modals and dialogs (teleported to body) -->
    <slot />
  </div>
</template>

<style scoped>
/* Main Content */
.admin-content {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1400px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
}

/* Filters Section */
.filters-section {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-xs);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.filters-row {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* Style filter-group items injected via #filters slot */
:slotted(.filter-group) {
  flex: 1;
  min-width: 200px;
}

/* Table Section */
.table-section {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Responsive - Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .filters-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .admin-content {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row {
    flex-direction: column;
  }

  :slotted(.filter-group) {
    min-width: auto;
  }
}
</style>
