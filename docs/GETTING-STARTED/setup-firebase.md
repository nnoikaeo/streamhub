---
title: Firebase Configuration
version: 1.0
updated: 2024-01-21
---

# Firebase Configuration

Set up Firebase project for StreamHub.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `streamhub` (or your name)
4. Accept terms and click **"Create project"**
5. Wait for project creation (1-2 minutes)

---

## Step 2: Register Web App

1. In Firebase Console, click **"</>Web"** (web icon)
2. App nickname: `streamhub-web`
3. Check "Also set up Firebase Hosting"
4. Click **"Register app"**
5. **Copy your config** (you'll need it next)

Config looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "streamhub-1234.firebaseapp.com",
  projectId: "streamhub-1234",
  storageBucket: "streamhub-1234.appspot.com",
  messagingSenderId: "12345678901",
  appId: "1:12345678901:web:abc123def456"
};
```

---

## Step 3: Setup Authentication

1. In Firebase Console, go to **"Authentication"**
2. Click **"Sign-in method"**
3. Click **"Google"** provider
4. Click the toggle to **enable**
5. Select project support email
6. Click **"Save"**

✅ Google Sign-in is now enabled!

---

## Step 4: Create Firestore Database

1. Go to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select region: **`us-central1`** (or closest to you)
5. Click **"Create"**

⚠️ **Security rules:** We'll update these later!

---

## Step 5: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **"APIs & Services"** → **"OAuth consent screen"**
4. Select **"External"** user type
5. Click **"Create"**
6. Fill form:
   - App name: `StreamHub`
   - User support email: your@email.com
   - Developer contact: your@email.com
7. Click **"Save and continue"**
8. Click **"Save and continue"** (skip scopes)
9. Click **"Save and continue"** (skip optional info)

---

## Step 6: Create OAuth Credentials

1. Go to **"Credentials"** in Google Cloud Console
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:3001` (if you use different port)
5. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. Click **"Create"**

---

## Step 7: Add Firebase Credentials to Project

Update `.env.local` with values from Firebase Console:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=your_apiKey
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_projectId
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storageBucket
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId
NUXT_PUBLIC_FIREBASE_APP_ID=your_appId
```

---

## Step 8: Enable Cloud Storage

1. In Firebase Console, go to **"Storage"**
2. Click **"Get started"**
3. Accept default security rules (for dev)
4. Choose region: same as Firestore
5. Click **"Done"**

---

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Google authentication enabled
- [ ] Firestore Database created
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] `.env.local` has all values
- [ ] Cloud Storage enabled

---

## 🔒 Important Security Notes

⚠️ **Development only:**
```
// Current Firestore rules (DEV - INSECURE!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ❌ ANYONE can read/write!
    }
  }
}
```

✅ **Production rules (SECURE):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

We'll update security rules before deploying to production!

---

## 🆘 Common Issues

**"Invalid OAuth Redirect URI"**
- Make sure redirect URIs match exactly
- Check for trailing slashes

**"Invalid API key"**
- Copy the exact value from Firebase Console
- No spaces before/after

**"Google Sign-in not working"**
- Verify Google is enabled in Auth methods
- Check console for error messages

---

## 📚 Next Steps

1. [Test your setup](installation.md)
2. [Learn authentication flow](../../GUIDES/authentication.md)
3. [Deploy to production](../../OPERATIONS/deployment.md)
