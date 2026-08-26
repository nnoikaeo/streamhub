# Architecture Overview

StreamHub is a **single-page app**. `nuxt.config.ts` sets `ssr: false`, so Nuxt renders
nothing on the server — Firebase Hosting serves a static `index.html` for every route and the
app boots in the browser. The Nitro server exists, but only for `/api/**`.

Do not describe this app as SSR. Nothing renders server-side.

```text
Browser (SPA)
  │
  ├── Firebase SDK ──────────────────────► Firestore
  │   reads and writes directly,           firestore.rules is the enforcement
  │   from app/composables/useFirestoreService.ts
  │
  └── fetch /api/** ─────────────────────► Nitro on Cloud Functions (nodejs22)
                                            things a browser must not do:
                                            service-account access, secrets,
                                            outbound calls to Google and Resend
```

Two paths reach data, and they are enforced differently. That split is the single most
important thing to hold in mind: a client-side read is only as safe as
[firestore.rules](../../firestore.rules), while an `/api/**` route runs with the Admin SDK and
must check permissions itself.

---

## The client

| Layer | Where | Notes |
|---|---|---|
| Pages | `app/pages/` | File-routed. `/admin/*` for admins, `/manage/*` for moderators, `/dashboard/*` for everyone |
| Route middleware | `app/middleware/auth.ts`, `admin.ts` | Gate on Pinia auth state — a UX guard, not a security boundary |
| Components | `app/components/` | 4 layers — see [COMPONENT_ARCHITECTURE.md](../DESIGN/COMPONENT_ARCHITECTURE.md) |
| Stores | `app/stores/` | `auth`, `dashboard`, `permissions`, `tags` |
| Composables | `app/composables/` | Data access and page logic. `useFirestoreService` and `useJSONMockService` implement the same interface |
| Utils | `app/utils/`, `shared/utils/` | `shared/` is auto-imported into **both** `app/` and `server/` |

### How each page is reached

The sidebar (`app/composables/useRoleNavigation.ts`) is not the whole navigation. Three live
admin pages have no sidebar entry and are reached only from the quick-action cards on
`/admin/overview`: **`/admin/dashboards`**, **`/admin/folders`** and **`/admin/permissions`**.
Permissions is also reached from the 🔑 button in Explorer, which swaps `/explorer` for
`/permissions` in the current route prefix — that is how one page serves both `/admin` and
`/manage`.

Absent from the sidebar is therefore not the same as unreachable. Every page under `app/pages/`
has a way in.

Data is fetched once, not streamed: there is no `onSnapshot` anywhere in the codebase. A page
loads what it needs and refetches after a write. Anything describing StreamHub as
"real-time" is describing a plan, not the code.

### Which backend a build talks to

`useServiceMode()` reads `NUXT_PUBLIC_USE_FIRESTORE` and picks the API base — `/api/{resource}`
against Firestore, or `/api/mock/{resource}` against the local JSON store. Production sets the
flag to `true` in [firebase.json](../../firebase.json), and `server/middleware/blockMockApi.ts`
returns 404 for every `/api/mock/*` path outside dev, so a mistaken flag cannot expose the mock
data in production.

> `npm run dev` points at the **production** Firestore. Local CRUD is real CRUD.

## The server

Nitro is built with the `firebase` preset and deployed as one Cloud Function, `server`.
[firebase.json](../../firebase.json) rewrites `/api/**` to it and everything else to
`index.html`.

| Route group | Purpose |
|---|---|
| `/api/invitations/*` | Invite lifecycle; sends mail through Resend with a secret the browser never sees |
| `/api/embed/request`, `/api/embed/{token}` | Looker embed proxy — the real report URL is sealed in an AES-256-GCM token so it never reaches the client |
| `/api/looker/*` | Looker Studio API via a service account |
| `/api/audit/*` | Audit log write and export |
| `/api/thumbnail/{dashboardId}` | Server-side image handling (`sharp` — which is why functions are never built on a Mac) |
| `/api/health` | Liveness check |
| `/api/mock/*` | Local JSON store. 404 outside dev |

Server middleware: `auth.ts` (identity), `blockMockApi.ts` (above), `securityHeaders.ts`.
`server/plugins/validateEnv.ts` reports missing configuration — it **must not throw**, because
the Firebase CLI executes plugins during deploy analysis with no env vars present.

---

## Security layers, in the order they actually stop something

1. **Firestore rules** — the real boundary for client reads and writes ([firestore.rules](../../firestore.rules))
2. **Server-side checks** — `/api/**` runs as admin, so each route re-checks the caller (`server/utils/companyAccess.ts`)
3. **Embed token** — encrypted, browser-bound via the `__session` cookie, 5-minute TTL
4. **Response headers** — CSP restricting `frame-src` to Looker, plus `X-Frame-Options`, `Referrer-Policy`, `nosniff`
5. **Route middleware** — hides what a user may not use; assume it can be bypassed
6. **Secrets** — `RESEND_API_KEY` and `EMBED_TOKEN_SECRET` come from Secret Manager, never the bundle

Permission semantics themselves live in [roles-and-permissions.md](../GUIDES/roles-and-permissions.md).

---

## Known gap

`app/plugins/firebase.ts` initializes Cloud Storage and provides `$firebase.storage`, but
nothing consumes it and there is no `storage.rules` file. StreamHub does not store files.

---

## See also

- [Tech Stack Details](tech-stack.md) — versions, and what is installed but unused
- [Data Flow](data-flow.md) — the paths a request actually takes
- [Folder Structure](folder-structure.md)
- [CLAUDE.md](../../CLAUDE.md) — operational rules that bite: deploy, expiry timestamps, Looker embeds
