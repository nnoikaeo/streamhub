# Firestore Invitations API — Implementation Plan

## Problem

Production (`streamhub-1c27a.web.app`) sets `NUXT_PUBLIC_USE_FIRESTORE: true` but invitation
operations still call `/api/mock/invitations/*` handlers which read/write `.data/*.json` files.
Those files don't exist in the production build (`.output/server/`), causing **500 errors**.

Mock handlers must stay JSON-only by design. We need **dedicated Firestore server handlers**.

---

## Current State Analysis

### Client-side: who calls what

| Caller | Endpoint | Method | Firestore-Aware? |
|--------|----------|--------|------------------|
| `useAdminResource.fetch()` | `/api/mock/invitations` | GET | **YES** — uses Firestore directly, never calls server |
| `useAdminResource.update()` | `/api/mock/invitations/:id` | PUT | **YES** — uses Firestore directly, **but bypasses server-side effects** |
| `useAdminResource.delete()` | `/api/mock/invitations/:id` | DELETE | **YES** — uses Firestore directly |
| `InviteUserModal.handleSubmit()` | `/api/mock/invitations` | POST | **NO** — always calls server |
| `InviteUserModal.handleReactivate()` | `/api/mock/invitations/reactivate` | POST | **NO** — always calls server |
| `BulkInviteModal.handleSubmit()` | `/api/mock/invitations/bulk` | POST | **NO** — always calls server |
| `InviteUserModal.loadDropdownData()` | `/api/mock/folders`, `/api/mock/groups` | GET | **NO** — always calls server |
| `BulkInviteModal.loadDropdownData()` | `/api/mock/groups` | GET | **NO** — always calls server |
| `invite/accept.vue` | `/api/mock/invitations/verify` | GET | **NO** — always calls server |
| `invite/accept.vue` | `/api/mock/invitations/accept` | POST | **NO** — always calls server |
| `useAuth.signInWithGoogle()` | `/api/mock/invitations/check` | GET | **NO** — always calls server |
| `useAuth.signInWithGoogle()` | `/api/mock/invitations/accept` | POST | **NO** — always calls server |

**Key insight**: `useAdminResource` already handles Firestore mode for basic CRUD (fetch/update/delete).
The problem is with **direct $fetch calls** that always hit the server AND with **update operations
that lose server-side effects** when routed through client-side Firestore.

### Server-side mock handlers (`server/api/mock/invitations/`)

All handlers use `jsonDatabase.ts` utilities (`readJSON`, `writeJSON`, `createItem`, `updateItem`) only.
None have Firestore awareness. They must remain JSON-only.

### Side effects in server handlers

| Handler | Email (Resend) | Audit Log (JSON) | Other side effects |
|---------|----------------|-------------------|--------------------|
| `index.post.ts` | YES | YES | Checks users.json for existing/inactive user |
| `bulk.post.ts` | YES (parallel) | YES | Checks users.json for each email |
| `accept.post.ts` | No | YES | Creates user in users.json + 3 security checks |
| `reactivate.post.ts` | No | YES | Updates user isActive=true in users.json |
| `[id].put.ts` | YES (on resend) | YES (cancel + resend) | Generates new `invitationCode` on resend |
| `check.get.ts` | No | No | Public, read-only |
| `verify.get.ts` | No | No | Public, read-only |

### Gap 1: Cancel / Resend bypass server-side effects

`cancelInvitation()` and `resendInvitation()` in `useAdminInvitations.ts` use
`useAdminResource.update()`. In Firestore mode this writes directly to Firestore from
the client — **the server handler `[id].put.ts` is never called**.

| Operation | What is lost in Firestore mode |
|-----------|--------------------------------|
| **Resend** | No new `invitationCode` generated, no email sent, no audit log |
| **Cancel** | No audit log |

**Resend is critically broken** — it changes the `status` field but the old invitation code
and link remain. The user receives no email.

### Gap 2: `logActivity()` writes to JSON files

`server/utils/auditLog.ts` uses `writeJSON('audit-log.json', ...)`.
In production the `.data/` directory doesn't exist. The function catches the error silently,
so nothing crashes, but **all invitation audit data is lost**.

This affects every handler that calls `logActivity()`: create, bulk, accept, reactivate,
cancel, and resend.

---

## Plan

### Part 1: Create Firestore server utilities

**New file: `server/utils/firestoreAdmin.ts`**

Provides server-side Firestore Admin SDK access:
- `getAdminDb()` — returns Admin Firestore instance (re-uses existing Firebase Admin init)
- `isFirestoreMode()` — checks `NUXT_PUBLIC_USE_FIRESTORE` env var
- Helper functions: `fsReadAll`, `fsQuery`, `fsSet`, `fsUpdate`

Already created during investigation — review and keep.

### Part 2: Create dedicated Firestore invitation handlers

**New directory: `server/api/invitations/`** (no `mock` in path)

Create Firestore-native handlers that mirror the mock API contract (same request/response shapes)
but read/write from Firestore using the Admin SDK:

| File | Mirrors | JSON reads/writes replaced with |
|------|---------|--------------------------------|
| `index.post.ts` | `mock/.../index.post.ts` | Firestore `invitations` + `users` collections |
| `bulk.post.ts` | `mock/.../bulk.post.ts` | Firestore `invitations` + `users` collections |
| `accept.post.ts` | `mock/.../accept.post.ts` | Firestore `invitations` + `users` collections |
| `reactivate.post.ts` | `mock/.../reactivate.post.ts` | Firestore `users` collection |
| `[id].put.ts` | `mock/.../[id].put.ts` | Firestore `invitations` collection |
| `check.get.ts` | `mock/.../check.get.ts` | Firestore `invitations` collection (read-only) |
| `verify.get.ts` | `mock/.../verify.get.ts` | Firestore `invitations` collection (read-only) |

**Side effects preserved in every handler:**
- Email sending via `emailService.ts` (Resend) — shared with mock handlers, no changes needed
- Audit logging — see Part 6 below

**`[id].put.ts` — Cancel & Resend handler (Gap 1 fix):**

This handler is critical. The mock version does:
- **Resend**: generates new `invitationCode` via `crypto.randomUUID()`, resets `expiresAt`,
  sends email via `sendInvitationEmail()`, writes audit log
- **Cancel**: updates status to `cancelled`, writes audit log

The Firestore version must replicate all of this. The client-side code
(`useAdminInvitations.cancelInvitation` / `resendInvitation`) must be changed to call the
server handler instead of using `useAdminResource.update()` directly — see Part 3.

**Security checks preserved** (in `accept.post.ts`):
- Email matching (case-insensitive)
- Race condition prevention (status check)
- Server-side expiry validation

### Part 3: Update client-side to call correct endpoints based on mode

**Strategy**: In each caller, check `useFirestoreMode` (from `useRuntimeConfig().public.useFirestore`)
and route to `/api/invitations/...` (Firestore) or `/api/mock/invitations/...` (JSON) accordingly.

This can be done via a shared helper in `useAdminInvitations.ts`:

```ts
function getApiBase(): string {
  const config = useRuntimeConfig()
  const useFirestore = config.public.useFirestore === true || String(config.public.useFirestore) === 'true'
  return useFirestore ? '/api/invitations' : '/api/mock/invitations'
}
```

**Files to update:**

| File | Changes |
|------|---------|
| `app/composables/useAdminInvitations.ts` | Add `getApiBase()` helper. Change `cancelInvitation()` and `resendInvitation()` from `resource.update()` to `$fetch(getApiBase() + '/' + id, { method: 'PUT', ... })` so they always go through the server handler with side effects. Update `fetchByCompany`, `fetchByStatus`, `bulkInvite`, `checkInvitation`, `verifyInvitation`, `acceptInvitation`, `reactivateUser` to use `getApiBase()`. |
| `app/components/admin/InviteUserModal.vue` | Replace hardcoded `/api/mock/invitations` with `getApiBase()` in `handleSubmit()` and `handleReactivate()`. |
| `app/components/admin/BulkInviteModal.vue` | Replace `/api/mock/invitations/bulk` with `getApiBase() + '/bulk'`. |
| `app/pages/invite/accept.vue` | Replace `/api/mock/invitations/verify` and `/api/mock/invitations/accept` with `getApiBase()` equivalents. |
| `app/composables/useAuth.ts` | Replace `/api/mock/invitations/check` and `/api/mock/invitations/accept` in auto-accept flow. |

**Cancel / Resend routing change (Gap 1 fix):**

Before (Firestore mode bypasses server):
```
cancelInvitation(id) → resource.update(id, { status: 'cancelled' })
                      → useAdminResource.update() → client-side updateDoc() → NO server call
```

After (always goes through server for side effects):
```
cancelInvitation(id) → $fetch(getApiBase() + '/' + id, { method: 'PUT', body: { status: 'cancelled' } })
                      → server handler → Firestore write + audit log
```

Same pattern for `resendInvitation()` — server generates new code + sends email.

### Part 4: Update auth middleware

**File: `server/middleware/auth.ts`**

- Add `/api/invitations/` to `PROTECTED_PREFIXES`
- Add `/api/invitations/check`, `/api/invitations/verify`, `/api/invitations/accept` to `PUBLIC_ROUTES`

### Part 5: Dropdown data (folders / groups)

`InviteUserModal` and `BulkInviteModal` also call `/api/mock/folders` and `/api/mock/groups`
which would have the same issue in production. Two options:

- **Option A (recommended)**: Use `useAdminFolders().fetchFolders()` and `useAdminGroups().fetchGroups()`
  which already respect Firestore mode via `useAdminResource`. Read from the shared `folders` / `groups`
  state instead of making separate API calls.
- **Option B**: Create `/api/folders/` and `/api/groups/` Firestore handlers (more work, less benefit
  since these are read-only and `useAdminResource` already handles them)

### Part 6: Audit logging in Firestore mode (Gap 2 fix)

Current `logActivity()` in `server/utils/auditLog.ts` writes to `.data/audit-log.json`.
In production this fails silently — all audit data is lost.

**Fix**: Create a Firestore-aware version of `logActivity()` that writes to a Firestore
`audit-log` collection when `isFirestoreMode()` is true. This can be done by:

1. Adding a `logActivityToFirestore()` function in `firestoreAdmin.ts` (or a new
   `auditLogFirestore.ts` utility)
2. Updating `logActivity()` to check `isFirestoreMode()` and branch accordingly

Alternatively, each new Firestore handler in `server/api/invitations/` can call
`logActivityToFirestore()` directly instead of the shared `logActivity()`.

**This change also benefits the broader system** — any future handler that uses `logActivity()`
will automatically write to Firestore in production.

---

## Files Summary

### New files (7 handlers + 1 utility)
- `server/utils/firestoreAdmin.ts` (already created, review and keep)
- `server/api/invitations/index.post.ts` — create single invitation
- `server/api/invitations/bulk.post.ts` — create bulk invitations
- `server/api/invitations/accept.post.ts` — accept invitation + create user
- `server/api/invitations/reactivate.post.ts` — reactivate inactive user
- `server/api/invitations/[id].put.ts` — cancel / resend invitation
- `server/api/invitations/check.get.ts` — check pending invitation by email
- `server/api/invitations/verify.get.ts` — verify invitation by code

### Modified files
- `server/middleware/auth.ts` — add new protected/public routes
- `server/utils/auditLog.ts` — add Firestore branch for `logActivity()`
- `app/composables/useAdminInvitations.ts` — add `getApiBase()`, route all methods, change cancel/resend to use server
- `app/components/admin/InviteUserModal.vue` — route to correct API + use composables for dropdowns
- `app/components/admin/BulkInviteModal.vue` — route to correct API + use composables for dropdowns
- `app/pages/invite/accept.vue` — route to correct API
- `app/composables/useAuth.ts` — route to correct API in auto-accept flow

### Unchanged files
- `server/api/mock/invitations/*` — keep as-is for dev/JSON mode
- `server/utils/jsonDatabase.ts` — unchanged
- `server/utils/emailService.ts` — shared by both mock and Firestore handlers

---

## Implementation Order

1. Part 1 — Firestore server utility (already done, review)
2. Part 4 — Auth middleware update (quick, unblocks Part 2)
3. Part 6 — Audit logging Firestore support (unblocks Part 2 handlers)
4. Part 2 — Create all 7 Firestore handlers (core work)
5. Part 5 — Fix dropdown data loading in modals
6. Part 3 — Client-side routing logic (composables + components + pages)
7. Test end-to-end: create, bulk invite, cancel, resend, accept, reactivate, verify
