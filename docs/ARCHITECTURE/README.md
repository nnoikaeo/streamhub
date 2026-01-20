# 🏗️ Architecture

Understand how StreamHub is structured.

## Navigation

- [Architecture Overview](overview.md)
- [Tech Stack Details](tech-stack.md)
- [Folder Structure](folder-structure.md)
- [Data Flow Diagram](data-flow.md)

---

## Quick Overview

StreamHub follows a **modular, layered architecture**:

```
┌─────────────────────────────────────┐
│     Frontend Layer (Nuxt + Vue)     │
│  - Pages, Components, Layouts       │
│  - State Management (Pinia)         │
├─────────────────────────────────────┤
│    Backend Layer (Firebase)         │
│  - Authentication (Google OAuth)    │
│  - Real-time Database (Firestore)   │
│  - Cloud Storage                    │
└─────────────────────────────────────┘
```

**Next:** [Full Architecture Overview](overview.md)
