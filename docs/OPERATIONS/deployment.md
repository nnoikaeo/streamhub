---
title: Deployment Guide
version: 3.0
updated: 2026-04-03
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
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain — **ต้องใช้ `web.app` domain** (ดูหมายเหตุด้านล่าง) |

> **⚠️ หมายเหตุ authDomain:** ต้องตั้งเป็น `streamhub-1c27a.web.app` ไม่ใช่ `streamhub-1c27a.firebaseapp.com`
> ถ้าใช้ `firebaseapp.com` Chrome Bounce Tracking Mitigation จะลบ state ทำให้ `getRedirectResult` return `null`
> และต้องเพิ่ม `https://streamhub-1c27a.web.app/__/auth/handler` ใน **Authorized redirect URIs**
> ใน [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) ด้วย
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Generating `FIREBASE_SERVICE_ACCOUNT`

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts
2. Click **Generate new private key**
3. Copy the entire JSON content as the secret value

## Manual Deploy

### Deploy ทุกอย่าง (Hosting + Functions) ผ่าน CI

Push to `main` → GitHub Actions build และ deploy ให้อัตโนมัติ เป็นวิธีหลักที่แนะนำ

### Deploy Hosting เท่านั้น จาก Local

ใช้เมื่อ CI deploy แล้ว production ยังแสดงโค้ดเก่า (chunk hash ไม่ตรง) หรือ hotfix เล็กน้อย:

```bash
bash scripts/deploy-hosting.sh
```

Script นี้จะ:
1. โหลด env vars จาก `.env.local` อัตโนมัติ
2. `npm run build`
3. `node scripts/generate-spa-index.mjs` (พร้อม Firebase config)
4. `firebase deploy --only hosting`

> **⚠️ อย่า** run `generate-spa-index.mjs` โดยตรงโดยไม่ set env vars — index.html จะมี apiKey ว่างเปล่าทำให้ login ไม่ได้

### Firestore Security Rules (Manual เท่านั้น)

CI service account **ไม่มีสิทธิ์** deploy Firestore rules ต้อง deploy มือเสมอ:

```bash
firebase deploy --only firestore:rules --project streamhub-1c27a
```

> **หมายเหตุ:** rules ไฟล์อยู่ที่ `firestore.rules` ใน root เพิ่ม section `"firestore"` ใน firebase.json ถ้าต้องการ (**แต่ CI จะ fail** เพราะ SA ไม่มีสิทธิ์ `firebaserules.googleapis.com`)

### Service Account Key หมดอายุ / ไม่ถูกต้อง

ถ้า CI fail ด้วย `Failed to authenticate`:
1. ไปที่ [GCP Console → IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) → `firebase-adminsdk-fbsvc@streamhub-1c27a.iam.gserviceaccount.com`
2. Tab **Keys** → Add Key → JSON → Download
3. อัปเดต GitHub Secret `FIREBASE_SERVICE_ACCOUNT` ด้วย JSON content ทั้งหมด
4. ลบ key เก่าออกจาก GCP (ป้องกัน leak)

```bash
# Deploy ทุกอย่างด้วย manual (ถ้าต้องการ)
npm run build
export $(grep NUXT_PUBLIC .env.local | xargs)
export NUXT_PUBLIC_USE_FIRESTORE=true NUXT_PUBLIC_USE_JSON_MOCK=false
node scripts/generate-spa-index.mjs
firebase deploy
```

## Pre-deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No console errors/warnings (ทดสอบด้วย role: user, moderator, admin)
- [ ] Environment variables set correctly ใน GitHub Secrets
- [ ] Firestore security rules อัปเดตแล้ว (deploy manual ถ้ามีเปลี่ยนแปลง)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] หลัง CI deploy ตรวจสอบ smoke test pass ใน Actions log

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
