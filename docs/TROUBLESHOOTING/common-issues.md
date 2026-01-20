---
title: Common Issues
version: 1.0
updated: 2024-01-21
---

# Common Issues & Solutions

## Issue: "Port 3000 already in use"

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Use different port
npm run dev -- --port 3001

# Or kill process on port 3000
# macOS/Linux
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Issue: Firebase Credentials Not Working

**Error:** `Invalid API Key` or authentication fails

**Solution:**
1. Check `.env.local` file exists
2. Verify all keys are correct (copy-paste from Firebase Console)
3. Ensure no extra spaces or quotes
4. Restart dev server: `npm run dev`

---

## Issue: Google Sign-in Popup Blocked

**Error:** "Popup blocked" in browser

**Solution:**
- Allow popups for localhost:3000 in browser settings
- Check browser console for errors
- Ensure OAuth is enabled in Firebase

---

## Issue: "Page shows blank/white screen"

**Solution:**
1. Check browser console (F12) for errors
2. Verify dev server is running (`npm run dev`)
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
4. Clear browser cache
5. Check `.nuxt/` folder exists

---

## Issue: TypeScript Errors in IDE

**Solution:**
```bash
# Restart TypeScript server (VS Code)
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or regenerate types
npm run dev
# Wait for build to finish
```

---

## Issue: Hot Module Replacement (HMR) Not Working

**Error:** Changes don't auto-reload

**Solution:**
1. Check dev server terminal
2. Restart: `npm run dev`
3. Clear `.nuxt/` folder: `rm -rf .nuxt`
4. Reinstall: `npm install`

---

## Issue: Build Fails: "Cannot find module"

**Solution:**
```bash
# Clear build cache
rm -rf .nuxt .output node_modules

# Reinstall
npm install

# Build again
npm run build
```

---

## Issue: Middleware Not Protecting Routes

**Error:** Can access dashboard without logging in

**Solution:**
- Check middleware is defined in page: `definePageMeta({ middleware: 'auth' })`
- Verify auth store has correct state
- Check browser console for middleware logs

---

## Issue: Firestore Rules Error

**Error:** "Permission denied" when accessing Firestore

**Solution:**
1. Go to Firebase Console → Firestore
2. Click "Rules" tab
3. Ensure rules match your use case
4. Test with Firestore Emulator locally

---

## Issue: CORS Error (Cross-Origin)

**Error:** `No 'Access-Control-Allow-Origin'`

**Solution:**
- This shouldn't happen with Firebase (handles CORS)
- Check if using custom API endpoint
- Verify origin is whitelisted

---

## Issue: Slow Performance / Lag

**Solution:**
1. Check network throttling in DevTools
2. Profile with Chrome DevTools (Performance tab)
3. Check Firestore queries are indexed
4. Reduce component re-renders with `computed` / `memo`

---

## Issue: GitHub Push Fails

**Error:** `Permission denied (publickey)`

**Solution:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your@email.com"

# Add to GitHub account
cat ~/.ssh/id_ed25519.pub

# Go to GitHub Settings → SSH Keys → Add

# Test connection
ssh -T git@github.com
```

---

## Issue: Can't Log Out

**Error:** Logout button doesn't work

**Solution:**
- Check browser console for errors
- Verify `logout()` function is called
- Check Firebase session cleared

---

## Debugging Tips

### Enable Debug Logs

```typescript
// In browser console
localStorage.debug = '*'
```

### Check Firebase Initialization

```typescript
// In browser console
console.log(firebase.auth)
console.log(firebase.db)
```

### Inspect Pinia Store

```typescript
// In browser console
const store = useAuthStore()
console.log(store.$state)
```

---

## When Everything Fails

```bash
# Nuclear option: Clean slate
rm -rf node_modules .nuxt .output package-lock.json
npm install
npm run dev
```

---

## Getting Help

1. Check [FAQ](faq.md)
2. Search error message in Google
3. Check [GitHub Issues](https://github.com/nnoikaeo/streamhub/issues)
4. Ask in team Slack
5. Create new GitHub issue

---

## See Also

- [FAQ](faq.md)
- [Installation Guide](../../GETTING-STARTED/installation.md)
- [Setup Guide](../../GETTING-STARTED/setup-firebase.md)
