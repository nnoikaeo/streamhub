---
title: Component Development
version: 1.0
updated: 2024-01-21
---

# Component Development

Guidelines for building Vue components in StreamHub.

## Component Structure

### File Organization

```
app/components/
├── Dashboard/
│   ├── DashboardCard.vue
│   ├── DashboardChart.vue
│   └── DashboardHeader.vue
├── User/
│   ├── UserAvatar.vue
│   └── UserProfile.vue
└── Common/
    ├── Button.vue
    ├── Modal.vue
    └── Loading.vue
```

### Component Template

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

// 2. Types
interface Props {
  title: string
  count?: number
  isActive?: boolean
}

interface Emits {
  click: []
  update: [value: string]
}

// 3. Props & Emits
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  isActive: false
})

const emit = defineEmits<Emits>()

// 4. Composables
const { user } = useAuth()

// 5. State
const isLoading = ref(false)

// 6. Computed
const displayName = computed(() => user.value?.displayName || 'Guest')

// 7. Methods
const handleClick = () => {
  emit('click')
}

// 8. Lifecycle
onMounted(() => {
  // Initialize
})
</script>

<template>
  <div class="component">
    <h2>{{ title }}</h2>
    <p v-if="isLoading">Loading...</p>
    <div v-else>
      <p>{{ displayName }} ({{ count }})</p>
      <button @click="handleClick">
        Click me
      </button>
    </div>
  </div>
</template>

<style scoped>
.component {
  padding: 1rem;
}
</style>
```

---

## Props & Types

### Define Props

```typescript
interface Props {
  title: string           // Required
  count?: number          // Optional
  color: 'red' | 'blue'  // Union type
  items: Array<{id: string; name: string}>
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  color: 'red'
})

// Use in template
// {{ props.title }}
```

### Define Emits

```typescript
interface Emits {
  save: [data: User]
  delete: [id: string]
  update: []  // No payload
}

const emit = defineEmits<Emits>()

// Emit event
emit('save', userData)
```

---

## State Management

### Local State

```vue
<script setup>
const count = ref(0)
const isOpen = ref(false)
const items = ref([])

const increment = () => count.value++
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

### Global State (Pinia)

```vue
<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    <p>{{ authStore.user.email }}</p>
  </div>
</template>
```

---

## Styling

### Tailwind Classes

```vue
<template>
  <div class="flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-bold text-gray-900">Title</h2>
    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Click
    </button>
  </div>
</template>
```

### Scoped Styles

```vue
<style scoped>
.card {
  @apply p-6 bg-white rounded-lg shadow;
}

.card:hover {
  @apply shadow-lg;
}
</style>
```

### CSS Modules (Alternative)

```vue
<style module>
.card {
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
}
</style>

<template>
  <div :class="$style.card">Content</div>
</template>
```

---

## Reusable Patterns

### Loading State

```vue
<script setup>
const isLoading = ref(false)

const fetchData = async () => {
  isLoading.value = true
  try {
    // Fetch data
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-center">
    <p>Loading...</p>
  </div>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### Error Handling

```vue
<script setup>
const error = ref<string | null>(null)

const loadData = async () => {
  try {
    // Fetch
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div v-if="error" class="p-4 bg-red-100 text-red-700 rounded">
    {{ error }}
  </div>
</template>
```

### Conditional Rendering

```vue
<template>
  <!-- v-if: For heavy components or rare conditions -->
  <component v-if="isVisible" />
  
  <!-- v-show: For frequently toggled visibility -->
  <component v-show="isVisible" />
  
  <!-- v-for: List rendering -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

---

## Composable Usage

### Using Composables

```vue
<script setup>
import { useAuth } from '~/composables/useAuth'

const { signInWithGoogle, logout } = useAuth()
</script>

<template>
  <button @click="signInWithGoogle">Sign In</button>
  <button @click="logout">Logout</button>
</template>
```

### Creating New Composables

```typescript
// composables/useCounter.ts
export const useCounter = (initial = 0) => {
  const count = ref(initial)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initial
  
  return { count, increment, decrement, reset }
}
```

---

## Best Practices

✅ **DO:**
- Keep components focused & small
- Use TypeScript for prop definitions
- Separate logic into composables
- Use scoped styles
- Extract reusable logic
- Add meaningful prop/emit documentation

❌ **DON'T:**
- Put all logic in one component
- Use inline styles with v-bind
- Over-nest component hierarchy
- Create components that do too much
- Ignore TypeScript errors

---

## Component Examples

### Simple Button

```vue
<template>
  <button
    :disabled="isLoading"
    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
    @click="$emit('click')"
  >
    {{ isLoading ? 'Loading...' : label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  isLoading?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
```

### Card Component

```vue
<template>
  <div class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
    <h3 class="font-bold">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
```

---

## Testing Components (Future)

```typescript
// MyComponent.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders title', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

---

## See Also

- [Architecture](../../ARCHITECTURE/folder-structure.md)
- [Styling Guide](#styling)
- [Testing Strategy](testing.md)
