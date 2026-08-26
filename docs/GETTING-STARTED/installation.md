---
title: Installation & Setup
---

# Installation & Setup

Get StreamHub running locally in 5 minutes.

## Prerequisites

Before you start, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or pnpm** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Firebase Account** - [Create free account](https://firebase.google.com/)
- **GitHub Account** - [Sign up here](https://github.com/)

**Check versions:**
```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
git --version
```

---

## Step 1: Clone Repository

```bash
git clone https://github.com/nnoikaeo/streamhub.git
cd streamhub
```

---

## Step 2: Install Dependencies

```bash
npm install
```

Or if using pnpm:
```bash
pnpm install
```

This installs all packages from `package.json`.

---

## Step 3: Setup Environment Variables

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Don't have these?** → [See Firebase Setup Guide](setup-firebase.md)

`.env.local` ต้องมี **`GOOGLE_SERVICE_ACCOUNT_KEY`** ด้วย (service account JSON บรรทัดเดียว) ไม่ใช่แค่คีย์ `NUXT_PUBLIC_*` ข้างบน — คีย์สาธารณะทำให้หน้าเว็บทำงาน แต่ Nitro route ที่ใช้ Admin SDK (`/api/embed/*`, `/api/health`, `/api/audit/*`, `/api/invitations/*`) ต้องใช้ตัวนี้ ถ้าไม่มีจะได้ `500` เฉพาะบางเส้นโดยหน้าอื่นดูปกติดี

> `npm run dev` ตั้งค่าให้อ่าน `.env.local` ผ่าน `--dotenv .env.local` ใน `package.json` — **ค่าปริยายของ Nuxt คือ `.env`** ถ้าธงนี้หายไปจะกลับไปอ่านไฟล์ผิด ดู [environment-variables.md](../REFERENCE/environment-variables.md)

---

## Step 4: Start Development Server

```bash
npm run dev
```

You should see:
```
✨ Nuxt DevTools Press Shift + Option + D to open DevTools
➜ Local:    http://localhost:3000/
```

---

## Step 5: Open in Browser

Visit **http://localhost:3000** and you should see:

1. **Login Page** with "Sign in with Google" button
2. Click button → Google OAuth popup
3. Sign in with your Google account
4. Redirected to **Dashboard** page

---

## ✅ Verification

Your setup is complete if:

- ✅ Development server running on localhost:3000
- ✅ Login page loads without errors
- ✅ Google Sign-in button works
- ✅ Can sign in and see dashboard
- ✅ No red errors in browser console

---

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- --port 3001
```

**Firebase credentials not working?**
- Double-check `.env.local` has correct values
- Make sure keys don't have extra spaces
- See [Firebase Setup Guide](setup-firebase.md)

**Dependencies installation fails?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Still stuck?** → [See Troubleshooting Guide](../TROUBLESHOOTING/common-issues.md)

---

## 📚 Next Steps

1. **Understand the structure** → [Architecture Overview](../ARCHITECTURE/overview.md)
2. **Learn authentication flow** → [Authentication Guide](../GUIDES/authentication.md)
3. **Deploy to production** → [Deployment Guide](../OPERATIONS/deployment.md)
4. **Start contributing** → [Contributing Guide](../CONTRIBUTING/workflow.md)

---

## 🆘 Need Help?

- Check the [FAQ](../TROUBLESHOOTING/faq.md)
- Read [Common Issues](../TROUBLESHOOTING/common-issues.md)
- Ask in team Slack channel
