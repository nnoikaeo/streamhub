---
title: Architecture Overview
version: 1.0
updated: 2024-01-21
---

# Architecture Overview

High-level architecture of StreamHub.

## System Design

```
┌──────────────────────────────────────────────────────────────┐
│                        User Browser                           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Nuxt 4 + Vue 3 Application                            │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Pages      │  │ Components   │  │  Layouts    │ │ │
│  │  │ - login.vue  │  │ - Card       │  │ - auth.vue  │ │ │
│  │  │ - dashboard  │  │ - Button     │  │ - default   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         ↓                                       ↓      │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │ Pinia Store (State Management)                    │ │ │
│  │  │  - user state                                     │ │ │
│  │  │  - authentication state                           │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │         ↓                                               │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │ Composables (Business Logic)                      │ │ │
│  │  │  - useAuth()                                      │ │ │
│  │  │  - useFirebase()                                  │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│         ↓                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Firebase SDK Client                                    │ │
│  │ - Authentication                                       │ │
│  │ - Firestore Database                                  │ │
│  │ - Cloud Storage                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │   Firebase Backend Services    │
        │                                │
        │ ┌──────────────────────────┐  │
        │ │ Authentication (Google)  │  │
        │ └──────────────────────────┘  │
        │                                │
        │ ┌──────────────────────────┐  │
        │ │ Firestore (Real-time DB) │  │
        │ └──────────────────────────┘  │
        │                                │
        │ ┌──────────────────────────┐  │
        │ │ Cloud Storage (Files)    │  │
        │ └──────────────────────────┘  │
        └────────────────────────────────┘
```

---

## Component Layers

### 1. **Presentation Layer** (Pages & Components)
- Vue components
- User interface
- Form handling
- Display logic

### 2. **State Management** (Pinia Store)
- User authentication state
- Global app state
- State mutations

### 3. **Business Logic** (Composables)
- Authentication logic
- Data fetching
- Utility functions

### 4. **API Layer** (Firebase SDK)
- Direct Firebase calls
- Authentication flows
- Database operations

### 5. **Backend** (Firebase Services)
- Authentication
- Database
- Storage
- Hosting

---

## Data Flow

### Authentication Flow

```
User clicks "Sign in"
    ↓
useAuth().signInWithGoogle()
    ↓
Firebase OAuth popup
    ↓
User approves
    ↓
Firebase Auth updates
    ↓
onAuthStateChanged listener
    ↓
setUser() → Pinia Store
    ↓
isAuthenticated = true
    ↓
Middleware checks auth
    ↓
Redirect to dashboard
```

### Database Flow

```
Component needs data
    ↓
useFirebase().getCollection('users')
    ↓
Firestore query
    ↓
Real-time listener (onSnapshot)
    ↓
Store in Pinia
    ↓
Update component reactive data
    ↓
Template re-renders
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| **Nuxt 4** | Full-stack framework with SSR, auto-routing |
| **Firebase** | Serverless backend, no infrastructure |
| **Pinia** | Lightweight state management for Vue |
| **TypeScript** | Type safety, better DX |
| **Tailwind CSS** | Utility-first styling, rapid UI dev |

---

## Scaling Considerations

### Current (v0.1)
- Single project
- Basic authentication
- Simple dashboard

### Phase 2 (v1.0)
- Multi-user support
- Roles & permissions
- Real-time features

### Phase 3 (v2.0)
- Microservices
- Advanced analytics
- Performance optimization

---

## Security Layers

1. **Authentication** - Google OAuth 2.0
2. **Authorization** - Firebase Security Rules
3. **Data Validation** - TypeScript types
4. **API Security** - Rate limiting (Cloud Functions)
5. **Transport** - HTTPS/TLS

---

## See Also

- [Folder Structure](folder-structure.md)
- [Tech Stack Details](tech-stack.md)
- [Data Flow Diagram](data-flow.md)
