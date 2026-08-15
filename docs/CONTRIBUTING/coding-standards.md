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

A caught value is `unknown` — it may be an `Error`, an H3 error from `createError()`, an ofetch `FetchError`, a Firebase error, or a bare string. Never widen the binding to `any` to read fields off it; use the helpers in `shared/utils/errors.ts`, which are auto-imported into both `app/` and `server/`.

```typescript
// ✅ GOOD
try {
  const result = await signInWithGoogle()
  return { success: true, result }
} catch (error: unknown) {
  const code = getErrorCode(error)                       // Firebase 'auth/…' codes
  const message = getErrorMessage(error, 'Sign-in failed')
  console.error('Sign-in error:', code, message)
  return { success: false, error: message }
}

// ❌ BAD — `any` turns every field read into an unchecked guess
try {
  const result = await signInWithGoogle()
} catch (error: any) {
  return { success: false, error: error.message }
}

// ❌ BAD — swallows the cause
try {
  const result = await signInWithGoogle()
} catch (error) {
  console.log('error')
}
```

| Helper | Returns |
|--------|---------|
| `getErrorStatus(e)` | HTTP status — h3 `statusCode`, then ofetch `response.status`, then `status` |
| `getErrorMessage(e, fallback?)` | Always a string: `Error.message` → `statusMessage` → `data.message` → `String(e)` → fallback |
| `getErrorDataMessage(e)` | `error.data.message` only, or `undefined` |
| `getErrorCode(e)` | Provider code, e.g. Firebase Auth's `auth/popup-closed-by-user` |
| `toError(e)` | A real `Error`, for state typed `Error \| null` |

In a Nitro handler the usual shape is rethrow-or-wrap:

```typescript
} catch (error: unknown) {
  console.error('[API] Error updating invitation:', getErrorMessage(error))
  if (getErrorStatus(error)) throw error
  throw createError({ statusCode: 500, message: 'Failed to update invitation' })
}
```

---

## Avoiding `any`

`@typescript-eslint/no-explicit-any` is the only rule with a remaining backlog, so every new `any` makes it worse. Fixes that do **not** count: `as any`, `@ts-ignore`, or widening a signature until the error goes away. If the real type is genuinely unclear, leave the site alone and say so rather than laundering it.

**Generic constraints — `object`, not `Record<string, unknown>`.** Interfaces have no implicit index signature, so `Record<string, unknown>` rejects `User`, `Dashboard`, `AdminGroup` and every other named type. `T extends object` accepts them and is enough whenever the body only uses `keyof T`, `Partial<T>` and `T[]`.

```typescript
// ✅ GOOD — accepts interfaces
export function useAdminResource<T extends object>(config: AdminResourceConfig<T>)

// ❌ BAD — useAdminResource<AdminGroup> stops compiling
export function useAdminResource<T extends Record<string, unknown>>(…)
```

**An all-optional constraint is a *weak type*.** TypeScript rejects an argument that has no property in common with it, so `T extends { isActive?: boolean }` refuses `Dashboard` (which uses `isArchived`). Read such flags through a narrow local shape instead.

**Pass the type argument to the data-layer generics.** `findById`, `findMany`, `createItem`, `updateItem` and `readJSON` fall back to their constraint when called bare, which leaves every field read unchecked downstream and invites an `as any[]` cast. This is how a real bug hid for months — see [Common Issues](../TROUBLESHOOTING/common-issues.md).

```typescript
// ✅ GOOD
const dashboards = await readJSON<Dashboard>('dashboards.json')
const user = await findById<User>('users.json', uid)

// ❌ BAD — result is JsonRecord, so the handler casts it away
const dashboards = await readJSON('dashboards.json')
const filtered = (dashboards as any[]).filter((d: any) => …)
```

**API responses: write the type against the handler, never `$fetch<any>`.** Read what the route actually returns — both routes, since `useServiceMode().apiBase()` picks between `server/api/**` and `server/api/mock/**` at runtime and the two are expected to match. Guessing here fails silently: the call site compiles, and the field is `undefined` in production.

Failure branches in this codebase are **returned values**, not thrown errors — handlers throw only for unexpected faults, and rethrow anything already carrying a `statusCode`. So responses model as discriminated unions on `success`, which makes the call sites narrow instead of reaching for optional chaining:

```typescript
export type InvitationAcceptResponse =
  | { success: false, error: string, message?: string }
  | { success: true, data: { invitation: Invitation, user: StoredUser } }
```

Response types for the invitation API live in `app/types/invitation.ts`; audit lives in `shared/types/audit.ts` because the server writes the same shape the page reads.

**Do not narrow a type past what the stored data honours.** `AuditEntry.action` stays `string` even though `logAuditEvent` only writes six values, because the same collection holds legacy invitation events written by `logActivity`. Two definitions of `AuditEntry` disagreed on exactly this, and the looser one was correct. When you widen for a reason like this, write the reason next to it.

**One name per shape.** A stored-user shape was declared six times as a local `UserRecord` with `[key: string]: any`. If two files describe the same payload, that is one type in a shared location — and if the shape genuinely differs from an existing type, say why in the name: `StoredUser` is not `User` because `User` declares its timestamps as `Date` while both stores hold ISO strings.

**Name the fields a rule reads, and stay generic over the row.** `checkDashboardAccess` cannot take `Dashboard`: handlers hand it raw store records whose timestamps are ISO strings or Firestore `Timestamp`s, not the `Date` the type declares, and the tests pass four-field fixtures. It takes `AccessDashboard` / `AccessFolder` / `AccessUser` instead — the fields the permission rules actually read, assembled from `AccessControl`, `AccessRestrictions` and `Pick<User, …>` rather than redeclared. Give such a shape at least one required field, or it becomes a weak type. Where the function returns rows it was given, make it generic (`<T extends AccessFolder>(…): T[]`) so callers keep every field they passed in.

**A result object with a `null` half is a discriminated union.** `{ allowed: boolean, user: any | null }` forced `any`, because every caller checks `allowed` first and then reads `.user`. Split it and the narrowing is free:

```typescript
export type CompanyAccessResult =
  | { allowed: true, user: User, reason: string }
  | { allowed: false, user: User | null, reason: string }
```

**Stored dates arrive in three shapes.** `AccessRestrictions.expiry` declares `Date`, the JSON store holds ISO strings, and Firestore holds `Timestamp`. `new Date(timestamp)` yields `Invalid Date`, which compares `false` against everything — the expiry silently never fires, and `as any` is what let that ship. Read stored dates through `toDate` / `isExpired` in `shared/utils/dates.ts`.

**`any` on a delegating wrapper hides signature drift.** The lazy wrappers in `useDashboardService` typed their backing service as `any`, so three of them had quietly stopped matching `IDashboardService` — a dropped `currentUserId`, a two-argument call into a one-parameter method, and a `getAuditLog(options?: any)` that discarded `limit`. Type the field as the real class (`private firestoreService: FirestoreService | null = null`, imported `import type` so the runtime import stays lazy) and the compiler checks every handoff.

**Test doubles.** Build the real shape when it is cheap — firebase-admin's `App` is just `{ name, options }`. When the real type is a large SDK surface the code only probes for existence (`Auth`, `Firestore`, `H3Event`), keep the stub partial but assert it through `unknown`, never `any`, and comment what the code under test actually reads. Do not build a `Partial<T>` and cast it back to `T`.

Hoisting a fixture into a named `const` or factory also sidesteps TypeScript's excess-property check, which only fires on object literals passed directly:

```typescript
// ✅ GOOD — extra fields allowed, no cast
function storedUser(role: string, uid = 'uid-1') {
  return { uid, role }
}
vi.mocked(findById).mockResolvedValue(storedUser('admin'))

// ❌ BAD — excess-property error, "fixed" with `as any`
vi.mocked(findById).mockResolvedValue({ uid: 'uid-1', role: 'admin' } as any)
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

## Testing

Vitest, run with `npm test` (`npm run test:watch` while working). Suites live under `tests/`, mirroring the directory they cover.

Server handlers are imported directly and called with a partial `H3Event`; the Nitro globals they rely on are shimmed in `tests/setup.ts` via `vi.stubGlobal`, so `getRouterParam`, `readBody` and friends keep h3's real declared signatures and stay typechecked.

```typescript
describe('normalizeBulkItems', () => {
  it('lowercases and trims emails', () => {
    const [item] = normalizeBulkItems({ items: [{ email: '  B@X.COM ', role: 'user', company: 'STTH' }] })
    expect(item!.email).toBe('b@x.com')
  })
})
```

When a handler's return type is a union — an auth-failure envelope or the real payload — narrow it in the test rather than reading straight through. Reading `result.checks` off the error branch throws instead of failing usefully, and a `toBeUndefined()` assertion passes for the wrong reason:

```typescript
function expectHealth(result: Awaited<ReturnType<typeof healthHandler>>): HealthResponse {
  if (!('checks' in result)) {
    throw new Error(`expected a health payload, got ${JSON.stringify(result)}`)
  }
  return result
}
```

⚠️ Run `npx vue-tsc --noEmit -p tests/tsconfig.json` as well. No generated `.nuxt/tsconfig.*` project covers `tests/`, so without it your fixtures are lint-checked and never typechecked.

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
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json   # Check TypeScript (app)
npx vue-tsc --noEmit -p tests/tsconfig.json       # Check TypeScript (tests)
npm run build                                     # Test build
```

⚠️ There is no `lint` or `type-check` npm script — use the `npx` forms above.

⚠️ Point `vue-tsc` at `.nuxt/tsconfig.app.json`, **not** the root `tsconfig.json`. The root config is `"files": []` plus project references, so `vue-tsc -p tsconfig.json` checks nothing and exits 0 with no output — a false pass.

`npm test`, `npm run build` and both typechecks are all expected to come back clean. Only lint still carries a backlog:

| Check | Baseline (2026-08-14, PR #361) |
|-------|--------------------------------|
| `npx eslint .` | 17 problems — every one `@typescript-eslint/no-explicit-any` |
| `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | 0 errors |
| `npx vue-tsc --noEmit -p tests/tsconfig.json` | 0 errors |
| `npm test` | 229 passing |

Any typecheck error, and any lint violation of a rule **other than `no-explicit-any`**, was introduced by your change. For `no-explicit-any` itself, compare the count before and after (`git stash`, re-run, `git stash pop`) or scope the run to the files you touched.

The remaining 17 sit at 15 in `app/`, 1 in `server/`, 1 in `scripts/`; `tests/` is clean. The permission path is done. What is left is unrelated leftovers: `useAdminResource` (6), `FormModal` (2), and single sites in `FormField`, `useAuth`, `useDashboardPage`, `errorMessages`, `dashboard` store (2), `seed-firestore`, `dashboards.post`, `bulkInvite`.

`app/stores/dashboard.ts` is the one place to leave alone without asking: `(d as any).company` covers a real gap between the type model and what Firestore holds — neither `Dashboard` nor `Folder` declares a top-level `company` — so removing it is a data-model decision, not a rename.

One deliberate skip: `app/stores/dashboard.ts:73,81` casts to read `.company` off a `Dashboard` and a `Folder`. Neither type declares the field, so the cast hides a real gap between the type model and what Firestore stores — closing it is a modelling decision, not a rename.

---

## See Also

- [Workflow Guide](workflow.md)
- [Code Review](code-review.md)
- [ESLint Config](eslint.config.mjs)
