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

Runs ESLint automatically:

```bash
npm run lint
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
npm run lint      # Check linting
npm run type-check # Check TypeScript
npm run build     # Test build
```

---

## See Also

- [Workflow Guide](workflow.md)
- [Code Review](code-review.md)
- [ESLint Config](eslint.config.mjs)
