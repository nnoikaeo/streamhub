# StreamHub 📊

**Dashboard Management System for StreamVoice**

A modern, secure, and scalable dashboard solution built with Nuxt 4, Firebase, and Tailwind CSS.

> **Status:** 🚀 Active Development | v0.1.0

---

## 🎯 Quick Navigation

### 👨‍💻 I want to...

| Goal | Read This |
|------|-----------|
| 🚀 **Start developing** | [Getting Started](docs/GETTING-STARTED/README.md) |
| 📋 **See development plan** | [Development Roadmap](docs/OPERATIONS/roadmap.md) |
| 🏗️ **Understand architecture** | [Architecture Overview](docs/ARCHITECTURE/overview.md) |
| 📚 **Learn features** | [Feature Guides](docs/GUIDES/README.md) |
| � **Understand roles & permissions** | [Roles & Permissions](docs/GUIDES/roles-and-permissions.md) |
| 🏢 **Learn company management** | [Company Management](docs/GUIDES/company-management.md) |
| �🔧 **Deploy to production** | [Deployment Guide](docs/OPERATIONS/deployment.md) |
| 🐛 **Fix a problem** | [Troubleshooting](docs/TROUBLESHOOTING/README.md) |
| 🤝 **Contribute code** | [Contributing Guide](docs/CONTRIBUTING/workflow.md) |
| 📡 **Check API reference** | [API Reference](docs/REFERENCE/README.md) |

---

## ✨ Features

- ✅ **Google Authentication** - Secure OAuth 2.0 Sign-in
- ✅ **Real-time Dashboard** - Firestore integration for live data
- ✅ **Role-based Access** - Protected routes and permissions
- ✅ **Cloud Storage** - File management with Firebase
- ✅ **Responsive UI** - Tailwind CSS + @nuxt/ui
- ✅ **TypeScript** - Full type safety
- ✅ **SSR Ready** - Server-side rendering support

---

## 🛠️ Tech Stack

```
Frontend:     Nuxt 4 + Vue 3 + TypeScript
Styling:      Tailwind CSS + @nuxt/ui
State:        Pinia
Backend:      Firebase (Auth, Firestore, Storage)
Deployment:   Firebase Hosting
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Firebase account

### Installation

```bash
# 1. Clone repository
git clone https://github.com/nnoikaeo/streamhub.git
cd streamhub

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 4. Run dev server
npm run dev

# 5. Open browser
# Visit http://localhost:3000
```

**[→ Detailed setup guide](docs/GETTING-STARTED/installation.md)**

---

## 📖 Full Documentation

- 🆕 [Getting Started](docs/GETTING-STARTED/README.md)
- 🏗️ [Architecture](docs/ARCHITECTURE/overview.md)
- 📚 [Development Guides](docs/GUIDES/README.md)
- 🔧 [Operations & Deployment](docs/OPERATIONS/deployment.md)
- 🐛 [Troubleshooting](docs/TROUBLESHOOTING/README.md)
- 🤝 [Contributing](docs/CONTRIBUTING/workflow.md)
- 📡 [API Reference](docs/REFERENCE/README.md)

---

## 🏃‍♂️ Available Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Build for production
npm run preview       # Preview production build

# Linting
npm run lint          # Run ESLint
```

---

## 🤝 Contributing

We welcome contributions! StreamHub uses **Git Flow Workflow** for organized development.

**Read our [Contributing Guide](docs/CONTRIBUTING/workflow.md) for detailed instructions.**

### Quick Git Flow Steps:

```bash
# 1. Start from develop (always!)
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feat/your-feature

# 3. Make changes and commit (use Conventional Commits)
git add .
git commit -m "feat(scope): description"

# 4. Push to GitHub
git push -u origin feat/your-feature

# 5. Open Pull Request (base: develop, compare: feat/your-feature)

# 6. After merge, cleanup
git checkout develop
git pull origin develop
git branch -d feat/your-feature
git push origin --delete feat/your-feature
```

### Branch Strategy:

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code | ✅ PR required, 1+ approvals |
| `develop` | Staging/integration | ✅ PR required, 1+ approvals |
| `feat/*` | Feature development | ❌ None |

### Commit Message Format:

```
<type>(<scope>): <subject>

feat(dashboard): add dashboard header component
fix(auth): resolve login timeout issue
docs(readme): update installation steps
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### More Info:
- 📖 Full workflow: [Contributing Guide](docs/CONTRIBUTING/workflow.md)
- 🏗️ Architecture: [Architecture Overview](docs/ARCHITECTURE/overview.md)
- 🛠️ Development: [Development Guides](docs/GUIDES/README.md)

---

## 📝 License

MIT License - See LICENSE file for details

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
