---
title: Coding Standards
version: 1.0
updated: 2024-01-21
---

# Coding Standards

Code style and best practices.

## TypeScript

✅ **Always use TypeScript:**

```typescript
// ✅ GOOD
interface User {
  id: string
  email: string
  name?: string
}

const user: User = {
  id: '123',
  email: 'user@example.com'
}

// ❌ BAD
const user = {
  id: '123',
  email: 'user@example.com'
}
```

---

## Vue Components

### Setup Script

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'

// 2. Types
interface Props {
  title: string
}

// 3. Props
const props = defineProps<Props>()

// 4. Emits
const emit = defineEmits<{
  click: []
}>()

// 5. State
const count = ref(0)

// 6. Computed
const doubled = computed(() => count.value * 2)

// 7. Methods
const increment = () => count.value++

// 8. Lifecycle
onMounted(() => {})
</script>

<template>
  <div>{{ title }}</div>
</template>

<style scoped>
/* Scoped styles */
</style>
```

### File Naming

```
✅ GOOD
app/components/DashboardCard.vue
app/pages/dashboard/index.vue
app/composables/useAuth.ts
app/stores/authStore.ts

❌ BAD
app/components/dashboardCard.vue
app/pages/dashboard.vue
app/composables/auth.ts
app/stores/auth.ts
```

---

## Naming Conventions

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_USERS = 100
const API_KEY = 'key'

// Functions: camelCase
function getUserData() {}

// Classes: PascalCase
class UserService {}

// Variables: camelCase
let currentUser = null
const userName = 'John'

// Booleans: is/has prefix
let isLoading = false
let hasError = false

// Arrays: plural
const users: User[] = []
const dashboards: Dashboard[] = []
```

---

## Formatting

### Linting

Runs ESLint (no npm script — invoke directly):

```bash
npx eslint .
```

### Line Length

Maximum 100 characters (soft limit, 120 hard limit).

### Indentation

```typescript
// 2 spaces
function example() {
  const x = 1
  if (x > 0) {
    console.log('positive')
  }
}
```

---

## Code Comments

### Use Comments Wisely

```typescript
// ✅ GOOD - Explains WHY, not WHAT
// Firebase batch writes have size limits
const batchSize = 500

// ✅ GOOD - Complex logic explanation
// Using exponential backoff for retries
// to handle temporary Firebase outages
const delay = Math.pow(2, attempt) * 1000

// ❌ BAD - Obvious code
// Increment counter
count++

// ❌ BAD - Comment lag
// Get the user (outdated, actually deletes)
deleteUser()
```

### TODO Comments

```typescript
// TODO: Add error handling
// FIXME: This breaks when count > 100
// HACK: Temporary workaround for Firebase issue
// NOTE: Must match Firestore security rules
```

---

## Error Handling

```typescript
// ✅ GOOD
try {
  const result = await signInWithGoogle()
  return { success: true, result }
} catch (error: any) {
  console.error('Sign-in error:', error.message)
  return { success: false, error: error.message }
}

// ❌ BAD
try {
  const result = await signInWithGoogle()
} catch (error) {
  console.log('error')
}
```

---

## Imports

```typescript
// ✅ GOOD - Organized imports
import { ref, computed } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/auth'
import { formatDate } from '~/utils/format'

// ❌ BAD - Random order
import formatDate from '~/utils/format'
import { useAuthStore } from '~/stores/auth'
import { ref } from 'vue'
```

---

## Vue Syntax

### Use Composition API

```typescript
// ✅ GOOD - Composition API
const count = ref(0)
const doubled = computed(() => count.value * 2)

// ❌ BAD - Options API
data() {
  return { count: 0 }
}
computed: {
  doubled() { return this.count * 2 }
}
```

### Shorthand Directives

```vue
<!-- ✅ GOOD -->
<input v-model="email" />
<button @click="submit">Submit</button>
<div v-if="isLoading">Loading...</div>
<div v-for="item in items" :key="item.id">{{ item }}</div>

<!-- ❌ BAD -->
<input :value="email" @input="email = $event.target.value" />
<button v-on:click="submit">Submit</button>
<div v-if="isLoading === true">Loading...</div>
<div v-for="item in items">{{ item }}</div>
```

---

## Back Navigation

A "← back" button should return the user to where they came from, and only fall back to a fixed route on a **cold entry** (direct link or hard refresh).

```typescript
// ✅ GOOD — history.state.back is the previous IN-APP entry, null on cold entry
const handleGoBack = async () => {
  if (window.history.state?.back) {
    router.back()
    return
  }
  await router.push('/dashboard/discover')
}

// ❌ BAD — hardcoded, ignores where the user came from
const handleGoBack = async () => {
  await router.push('/dashboard/discover')
}

// ❌ BAD — history.length counts the WHOLE TAB, so a direct link opened
// after visiting another site navigates the user out of the app
if (window.history.length > 1) router.back()
```

`router.back()` preserves Explorer folder + scroll position, which `router.push()` cannot.

**Exception:** after a destructive action (archive, delete), push the list route explicitly — the previous page's listing is stale and `router.back()` would restore an entry that no longer exists. See `confirmArchive()` in `app/pages/dashboard/view/[id].vue`.

Implemented in `app/pages/dashboard/view/[id].vue` → `handleGoBack()` and `app/components/features/PermissionsPage.vue` → `goBackToExplorer()`.

---

## Custom Cells in `DataTable`

`DataTable` is the shared admin table. To render a cell as something other than text, pass a **`#cell-<key>` slot** from the page — do **not** add another `isXxxColumn` flag.

```vue
<!-- ✅ GOOD — the page owns the rendering, DataTable stays generic -->
<DataTable :columns="columns" :data="filteredTags" :actions="actions">
  <template #cell-name="{ item }">
    <TagBadge :tag="item" size="md" />
  </template>
</DataTable>
```

```vue
<!-- ❌ BAD — forces the generic admin table to import a feature component -->
<!-- columns: [{ key: 'name', isTagColumn: true }] -->
<div v-else-if="column.isTagColumn">
  <TagBadge :tag="item" />
</div>
```

The slot outlet in `DataTable.vue` keeps the default rendering as **fallback content**, so a page that passes no slot behaves exactly as before:

```vue
<slot v-else :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
  <span>{{ getCellValue(item, column.key) }}</span>
</slot>
```

Slot props: `item` (the whole row), `value` (that column's raw value), and `index` (0-based position in the full filtered list, already offset by the current page — so page 2 starts at 10, not 0).

Use `index` when the column should show a **position** rather than a stored field. `/admin/tags` renders `ลำดับ` as `index + 1`, because printing the raw `sortOrder` leaves gaps in the numbering after a tag is deleted:

```vue
<template #cell-sortOrder="{ index }">{{ index + 1 }}</template>
```

The four legacy flags (`isNameColumn`, `isStatusColumn`, `isRoleColumn`, `isGroupsColumn`) still work — leave them alone, but write new custom cells as slots.

**Reuse the real component.** `/admin/tags` renders `TagBadge`, the same component Explorer and dashboard cards use, so the admin table shows what users actually see. A hand-rolled preview in the table would drift from the real badge.

Implemented in `app/components/admin/DataTable.vue` and `app/pages/admin/tags/index.vue`.

---

## Tailwind CSS

```vue
<!-- ✅ GOOD - Clear utility usage -->
<div class="flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow">
  <h2 class="text-2xl font-bold">Title</h2>
  <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Submit
  </button>
</div>

<!-- ❌ BAD - Inline styles -->
<div style="display: flex; padding: 24px;">
  <h2 style="font-size: 24px; font-weight: bold;">Title</h2>
</div>
```

---

## Async/Await

```typescript
// ✅ GOOD
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

// ❌ BAD - Callbacks
function fetchData(callback) {
  fetch('/api/data')
    .then(res => res.json())
    .then(data => callback(data))
}
```

---

## Testing (Future)

```typescript
// When implemented
describe('useAuth', () => {
  it('should sign in user', async () => {
    const { signInWithGoogle } = useAuth()
    const result = await signInWithGoogle()
    expect(result.success).toBe(true)
  })
})
```

---

## Security

✅ **DO:**
- Never commit `.env` files
- Validate user input
- Use Firebase security rules
- Keep dependencies updated

❌ **DON'T:**
- Store credentials in code
- Log sensitive data
- Disable TypeScript checks
- Ignore security warnings

---

## Performance

✅ **DO:**
- Use `computed` for expensive calculations
- Implement virtual lists for large datasets
- Lazy-load components
- Optimize bundle size

❌ **DON'T:**
- Create new objects in render
- Deeply nest components
- Unsubscribe from listeners
- Block the main thread

---

## Pre-commit Checks

```bash
# Run before committing
npm test                                          # Vitest suite
npx eslint .                                      # Check linting
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json   # Check TypeScript
npm run build                                     # Test build
```

⚠️ There is no `lint` or `type-check` npm script — use the `npx` forms above.

⚠️ Point `vue-tsc` at `.nuxt/tsconfig.app.json`, **not** the root `tsconfig.json`. The root config is `"files": []` plus project references, so `vue-tsc -p tsconfig.json` checks nothing and exits 0 with no output — a false pass.

`npm test`, `npm run build` and the typecheck are all expected to come back clean. Only lint still carries a backlog:

| Check | Baseline (2026-08-11, PR #353) |
|-------|--------------------------------|
| `npx eslint .` | 382 problems — every one `@typescript-eslint/no-explicit-any` |
| `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | 0 errors |

Any typecheck error, and any lint violation of a rule **other than `no-explicit-any`**, was introduced by your change. For `no-explicit-any` itself, compare the count before and after (`git stash`, re-run, `git stash pop`) or scope the run to the files you touched.

The remaining `any`s sit at 152 in `server/`, 151 in `app/`, 74 in `tests/`, 5 in `scripts/`. The biggest single shape is `catch (e: any)` (71), which needs a shared error-narrowing helper before it can move to `unknown`; then 43 `Record<string, any>` and 24 `any[]`.

---

## See Also

- [Workflow Guide](workflow.md)
- [Code Review](code-review.md)
- [ESLint Config](eslint.config.mjs)
