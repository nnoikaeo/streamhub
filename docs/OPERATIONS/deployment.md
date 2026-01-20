---
title: Deployment Guide
version: 1.0
updated: 2024-01-21
---

# Deployment to Production

Deploy StreamHub to Firebase Hosting.

(See [First Deployment Guide](../../GETTING-STARTED/first-deployment.md) for detailed steps)

## Quick Commands

```bash
# Build
npm run build

# Login to Firebase
firebase login

# Deploy
firebase deploy
```

## Pre-deployment Checklist

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables set correctly
- [ ] Firebase security rules updated
- [ ] Database backed up

## Rollback

```bash
firebase hosting:channels:list
firebase hosting:clone FROM TO
```

---

## See Also

- [Versioning](versioning.md)
- [Monitoring](monitoring.md)
