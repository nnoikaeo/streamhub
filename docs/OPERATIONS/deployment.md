---
title: Deployment Guide
version: 2.0
updated: 2026-03-28
---

# Deployment to Production

StreamHub deploys to **Firebase Hosting** (static SPA) + **Cloud Functions for Firebase 2nd gen** (Nitro server API routes).

## Architecture

```
┌─────────────────────────────────────────────┐
│  Firebase Hosting (CDN)                     │
│  Serves: .output/public (SPA, assets)       │
│  Rewrites: /** → index.html (SPA routing)   │
│            /api/** → Cloud Function "server" │
├─────────────────────────────────────────────┤
│  Cloud Functions for Firebase (2nd gen)     │
│  Serves: .output/server (Nitro API routes)  │
│  Routes: /api/audit/*, /api/embed/*,        │
│          /api/looker/*, /api/mock/*          │
└─────────────────────────────────────────────┘
```

## CI/CD (Automated)

Deployment is automated via GitHub Actions:

- **Push to `main`** → auto-deploy to production (`deploy.yml`)
- **Pull request** → preview channel deploy (`preview.yml`)

### Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account key JSON (for CI deploy) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `NUXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Generating `FIREBASE_SERVICE_ACCOUNT`

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts
2. Click **Generate new private key**
3. Copy the entire JSON content as the secret value

## Manual Deploy

```bash
# 1. Install Firebase CLI (if not already)
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Build with Firebase preset
npm run build

# 4. Deploy everything (Hosting + Functions)
firebase deploy

# Deploy only Hosting
firebase deploy --only hosting

# Deploy only Functions
firebase deploy --only functions
```

## Pre-deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No console errors/warnings
- [ ] Environment variables set correctly
- [ ] Firebase security rules updated
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)

## Custom Domain + SSL

1. Go to **Firebase Console → Hosting → Add custom domain**
2. Add your domain (e.g., `streamhub.app`)
3. Update DNS records as instructed by Firebase:
   - Add `TXT` record for domain verification
   - Add `A` records pointing to Firebase IPs
4. SSL certificate is **automatically provisioned** by Firebase (Let's Encrypt)
5. Wait for DNS propagation (can take up to 24 hours)

## Preview Channels

Preview deployments are created automatically for PRs. To manage manually:

```bash
# Create a preview channel
firebase hosting:channel:deploy preview-feature-x

# List channels
firebase hosting:channel:list

# Delete a channel
firebase hosting:channel:delete preview-feature-x
```

## Rollback

```bash
# List recent deploys
firebase hosting:releases:list --limit 5

# Rollback to a previous release
firebase hosting:rollback
```

## Environment Variables for Cloud Functions

For server-only secrets (Resend API key, Google service account), set them as Cloud Functions environment config:

```bash
# Set secrets for Cloud Functions (2nd gen uses Secret Manager)
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_KEY
```

---

## See Also

- [Versioning](versioning.md)
