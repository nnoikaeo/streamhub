# Data Flow

The paths a request actually takes. Function and route names here are real — grep them.

Two rules shape every flow below:

- The client talks to **Firestore directly**; [firestore.rules](../../firestore.rules) is what
  stops it. `/api/**` runs with the Admin SDK and must re-check permissions itself.
- Reads are **one-shot**. There is no `onSnapshot` in the codebase, so nothing updates until
  something refetches.

---

## 1. Sign-in

```text
login.vue
  └─ useAuth().signInWithGoogle()
       └─ signInWithPopup(auth, GoogleAuthProvider)   ← popup, not redirect
            └─ Google consent
                 └─ onAuthStateChanged fires
                      └─ authStore.setUser()
                           └─ middleware/auth.ts lets the route through
```

The popup is the failure surface: a blocked popup gives `auth/popup-blocked` and nothing else
happens. `browserLocalPersistence` is set in `app/plugins/firebase.ts`, so a refresh restores
the session without a second popup. Details and the `authDomain` caveat:
[authentication.md](../GUIDES/authentication.md).

## 2. Listing dashboards

```text
page  →  useDashboardPage()  →  useFirestoreService()  →  getDocs(...)
                                      │
                                      └─ canAccessDashboard(dashboardId, userId)
```

Visibility is default-private plus an `access.public` flag, resolved against the dashboard's
own grants and inherited from its folder chain. The rules are in
[roles-and-permissions.md](../GUIDES/roles-and-permissions.md); the same logic exists
server-side as `checkDashboardAccess` / `filterAccessibleDashboards` in
`server/utils/companyAccess.ts`, and the two must agree.

`access.restrictions.expiry` is a Firestore `Timestamp` in production and an ISO string in the
JSON store. Read it with `toDate` / `isExpired` from `shared/utils/dates.ts` — `new Date(value)`
returns `Invalid Date`, compares false, and grants access that should have expired.

## 3. Opening a Looker dashboard

Two separate requests. This is the flow to understand before touching embeds.

```text
dashboard/view/[id].vue
  │
  ├─(1) POST /api/embed/request  { dashboardId }
  │        ├─ event.context.auth.uid           ← identity, from server middleware
  │        ├─ user active?  dashboard exists?
  │        ├─ checkDashboardAccess(user, dashboard, folders)
  │        ├─ createEmbedToken({ embedUrl, uid, exp })   AES-256-GCM, 5-minute TTL
  │        └─ setCookie(__session)             ← binds the token to this browser
  │
  └─(2) <iframe src="/api/embed/{token}">
           ├─ decrypt, check exp, match __session
           └─ 302 → the real Looker URL
```

The real report URL never reaches the client — it is encrypted inside the token, which is why
the payload is encrypted rather than merely signed. The token is stateless, so it survives an
instance change and can be redeemed more than once within its TTL. That is the fix for BUG-031;
the earlier in-memory `Map` produced random 403s across autoscaled instances.

What this flow cannot fix: Safari blocks Google's third-party cookies inside the iframe, so
reports shared to named accounts render Looker's own error page. See
[looker-sharing-policy.md](../OPERATIONS/looker-sharing-policy.md).

## 4. Inviting a user

```text
admin/invitations  →  POST /api/invitations        (or /bulk)
                        ├─ write the invitation document
                        └─ server/utils/emailService.ts → Resend
                             RESEND_API_KEY from Secret Manager

invite/accept.vue  →  GET  /api/invitations/verify  → POST /api/invitations/accept
                                                        └─ create the user document
```

`.env.local` holds the **real** Resend key, so an invite sent from localhost sends a real
email.

## 5. Mock vs Firestore

```text
useServiceMode()  ──  NUXT_PUBLIC_USE_FIRESTORE=true  →  /api/{resource}
                  └─  otherwise                       →  /api/mock/{resource}
```

`server/middleware/blockMockApi.ts` returns 404 for `/api/mock/*` in any non-dev build, so the
flag cannot leak mock data into production.

## 6. Deploy

CI/CD is live, not planned.

```text
push to main
  └─ .github/workflows/deploy.yml
       └─ firebase deploy --only hosting,functions --force
```

Hosting can also go out locally with `bash scripts/deploy-hosting.sh`. Functions cannot —
a Mac-built `sharp` is the wrong architecture for the Linux runtime. Firestore rules deploy
manually; the CI service account lacks the permission. Full procedure:
[deployment.md](../OPERATIONS/deployment.md).

---

## See also

- [Architecture Overview](overview.md)
- [Tech Stack Details](tech-stack.md)
- [Authentication Guide](../GUIDES/authentication.md)
- [Database Schema](../GUIDES/database-schema.md)
