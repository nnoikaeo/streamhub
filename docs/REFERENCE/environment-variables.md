---
title: Environment Variables
version: 1.0
updated: 2024-01-21
---

# Environment Variables Reference

All environment variables used in StreamHub.

## Firebase Variables

**Required for authentication and database access:**

```env
# Firebase Authentication
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

## Getting Your Values

1. Go to [Firebase Console](https://console.firebase.com)
2. Select your project
3. Click ⚙️ → Project Settings
4. Copy values from "Your apps" section

## Using Variables

### In Code (Client-Side)

```typescript
const config = useRuntimeConfig()
console.log(config.public.firebase.apiKey)
```

### In Environment

Create `.env.local`:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=streamhub-1234.firebaseapp.com
```

⚠️ **Never commit `.env.local`** - it contains secrets!

## Production

For production deployment:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=prod_key_here
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prod_domain.com
```

---

## See Also

- [Firebase Setup](../../GETTING-STARTED/setup-firebase.md)
- [Installation Guide](../../GETTING-STARTED/installation.md)
