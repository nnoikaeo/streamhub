---
title: FAQ
version: 1.0
updated: 2024-01-21
---

# Frequently Asked Questions

## General

**Q: What is StreamHub?**

A: StreamHub is a Dashboard Management System for StreamVoice built with Nuxt 4, Firebase, and TypeScript.

**Q: Can I use this for my own project?**

A: Yes! It's MIT licensed. See LICENSE file.

**Q: What's the tech stack?**

A: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Firebase, Pinia.

---

## Development

**Q: How do I start developing?**

A: Follow the [Installation Guide](../../GETTING-STARTED/installation.md).

**Q: Do I need to install Firebase locally?**

A: No, Firebase runs in the cloud. You just use the SDK.

**Q: Can I use other databases instead of Firebase?**

A: Yes, but you'll need to rewrite the backend integrations.

---

## Authentication

**Q: Why Google Sign-in only?**

A: Simplicity and security. Can be extended to other providers.

**Q: How do I test authentication locally?**

A: Use a test Google account for development.

**Q: Are passwords stored securely?**

A: Yes, Firebase handles credential management. Your app never sees the password.

---

## Deployment

**Q: How do I deploy?**

A: Run `npm run build && firebase deploy`.

**Q: What's the Firebase free tier limit?**

A: 1GB storage, 50K reads/day, 20K writes/day.

**Q: Can I use other hosting platforms?**

A: Yes, but Firebase Hosting is the easiest with Nuxt.

---

## Support

**Q: Where's the API documentation?**

A: Check [Reference Docs](../../REFERENCE/README.md).

**Q: Can I request new features?**

A: Create an issue on GitHub.

**Q: Who do I contact for help?**

A: Ask in team Slack or create GitHub issue.

---

## Pricing

**Q: Is this free?**

A: Yes, with Firebase free tier included.

**Q: When do I need to pay?**

A: When exceeding Firebase free tier limits.

**Q: How much will it cost at scale?**

A: Roughly $0.06 per 100K reads, $0.18 per 100K writes.

---

## See Also

- [Common Issues](common-issues.md)
- [Troubleshooting Guide](README.md)
