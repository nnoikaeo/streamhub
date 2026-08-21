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

### ไฟล์ไหนถูกโหลดเมื่อไร

`.env.local` เป็นไฟล์เดียวที่ถือความจริง — ทั้งสามทางเข้าอ่านไฟล์นี้:

| ทาง | อ่าน | ทำไม |
|---|---|---|
| `npm run dev` | `.env.local` | ผ่าน `nuxt dev --dotenv .env.local` ใน `package.json` |
| `bash scripts/deploy-hosting.sh` | `.env.local` | สคริปต์ `source` เอง |
| สคริปต์ใน `scripts/*.mjs` | `.env.local` | แต่ละตัวแกะไฟล์เอง |
| CI (`.github/workflows/deploy.yml`) | GitHub Secrets | ไม่มีไฟล์ `.env*` บนเครื่อง runner |

> ⚠️ **Nuxt โหลด `.env` เป็นค่าปริยาย ไม่ใช่ `.env.local`** — ธงบรรทัดคำสั่งข้างบนคือสิ่งเดียวที่บังคับให้อ่านไฟล์ที่ถูก ถ้าถอดออก dev server จะกลับไปอ่าน `.env` ที่ไม่มี `GOOGLE_SERVICE_ACCOUNT_KEY` ⇒ Nitro route ที่ต้องใช้ Admin SDK จะพังทั้งหมด **แต่หน้าเว็บส่วนใหญ่ยังทำงานปกติ** เพราะฝั่ง client ใช้ config สาธารณะคนละชุด — อาการที่เห็นคือ `500 (Server Error)` เฉพาะบางเส้น ไม่ใช่จอขาว ดู [common-issues.md](../TROUBLESHOOTING/common-issues.md)

> ⚠️ **`.env.local` มีคีย์ Resend ตัวจริง** — ต่างจาก `.env` ที่ใส่ `re_test_xxxxxxxxxxxx` ไว้ ⇒ ตั้งแต่ dev server อ่าน `.env.local` **การกดส่งคำเชิญบน localhost จะส่งอีเมลออกจริง** ไม่ใช่แค่เขียนเอกสารลง Firestore เหมือนแต่ก่อน ทดสอบด้วยอีเมลของตัวเอง

> `NUXT_PUBLIC_USE_JSON_MOCK` ที่ยังอยู่ใน `.env` และ `nuxt.config.ts` **ไม่มีโค้ดไหนอ่านแล้ว** — `useServiceMode` คิดจาก `isMock = !isFirestore` อย่างเดียว ไม่ต้องตามไปใส่ใน `.env.local`

## ความลับฝั่ง server (Cloud Functions)

ค่าที่ห้ามหลุดถึง client **ไม่ได้เดินทางผ่าน GitHub Secrets** — ประกาศชื่อไว้ที่ `secretEnvironmentVariables` ใน [firebase.json](../../firebase.json) แล้ว `scripts/prepare-firebase-deploy.mjs` คัดลงเป็น `functions.yaml` ตอน deploy ส่วน**ค่าจริงอยู่ใน Google Secret Manager** ของโปรเจกต์ Firebase

| Key | ใช้ทำอะไร |
|---|---|
| `RESEND_API_KEY` | ส่งอีเมลคำเชิญ |
| `EMBED_TOKEN_SECRET` | กุญแจ AES-256-GCM ที่ปิดผนึก token ของ `/api/embed/*` |

ตั้งค่าครั้งแรกหรือหมุนกุญแจ:

```bash
openssl rand -base64 32          # สร้างค่าใหม่
firebase functions:secrets:set EMBED_TOKEN_SECRET --project streamhub-1c27a
```

แล้ววางค่า**เดียวกัน**ลง `.env.local` เพื่อให้ dev server ใช้ได้ · หมุนกุญแจแล้ว token ที่ค้างอยู่จะใช้ไม่ได้ทันที ผู้ใช้ที่เปิดแดชบอร์ดค้างไว้ต้องรีเฟรชหนึ่งครั้ง (อายุ token 5 นาที)

> ถ้า `EMBED_TOKEN_SECRET` ว่าง `POST /api/embed/request` จะตอบ 500 `Embed tokens are not configured` — ตั้งใจให้ดังกว่าการแจก token ที่ไม่มีใครเปิดอ่านได้

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
