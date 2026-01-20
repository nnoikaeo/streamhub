---
title: First Deployment
version: 1.0
updated: 2024-01-21
---

# First Deployment to Firebase Hosting

Deploy your StreamHub to the internet!

## Prerequisites

- ✅ Development running locally
- ✅ Firebase project created
- ✅ Firebase CLI installed

---

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## Step 2: Build for Production

```bash
npm run build
```

This creates `.output/` folder with optimized build.

---

## Step 3: Login to Firebase

```bash
firebase login
```

This opens browser to authenticate. Sign in with your Google account.

---

## Step 4: Initialize Firebase Hosting

```bash
firebase init hosting
```

When prompted:
- **Use an existing project?** → Yes
- **Select project** → streamhub
- **Public directory** → `.output/public`
- **Single-page app?** → Yes
- **Overwrite index.html?** → No

---

## Step 5: Deploy

```bash
firebase deploy
```

You should see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/streamhub-1234
Hosting URL: https://streamhub-1234.web.app
```

---

## Step 6: Visit Your Live App

Open the **Hosting URL** in browser. Your app is now live! 🎉

---

## ✅ Verification

After deployment, check:

- ✅ App loads without errors
- ✅ Google Sign-in works
- ✅ Can sign in and see dashboard
- ✅ Data persists in Firestore

---

## 📊 Environment Variables in Production

Make sure production Firebase project has:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=production_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=streamhub-prod.firebaseapp.com
...
```

Create separate `.env.production` for prod values.

---

## 🔒 Security Rules Update

Before production, update Firestore security rules:

1. Go to Firebase Console → Firestore
2. Click **"Rules"** tab
3. Update with proper rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /dashboards/{dashboardId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
    }
  }
}
```

4. Click **"Publish"**

---

## 📚 Next Steps

1. [Monitor your app](../../OPERATIONS/monitoring.md)
2. [Update version](../../OPERATIONS/versioning.md)
3. [Add more features](../../GUIDES/README.md)

---

## 🆘 Deployment Issues?

- Check [Firebase docs](https://firebase.google.com/docs/hosting)
- See [Troubleshooting guide](../../TROUBLESHOOTING/README.md)
