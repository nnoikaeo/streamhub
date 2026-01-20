# StreamHub Project Instructions

StreamHub is a Dashboard Management System for StreamVoice company (150 employees).
Built with Nuxt 4, TypeScript, Firebase, Tailwind CSS, and @nuxt/ui.

## Project Setup Progress

- [x] Create .github directory and copilot-instructions.md
- [x] Scaffold Nuxt 4 project with TypeScript
- [x] Install Firebase and dependencies
- [x] Install Pinia and state management
- [x] Set up authentication structure
- [x] Create dashboard pages and layout
- [x] Compile and validate project
- [x] Create and run dev task

## Tech Stack

- **Framework**: Nuxt 4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: @nuxt/ui
- **Form Validation**: Vee-Validate v4 + Zod
- **State Management**: Pinia + Firebase Composables
- **Backend**: Cloud Firestore, Firebase Auth
- **Storage**: Cloud Storage
- **Hosting**: Firebase Hosting

## Development Server

Dev server running on `http://localhost:3000`

To start dev server:
```bash
npm run dev
```

## Project Structure

- `app/composables/` - Vue composables (useAuth)
- `app/components/` - Reusable Vue components
- `app/layouts/` - Page layouts
- `app/middleware/` - Route middleware
- `app/pages/` - Application pages
- `app/plugins/` - Nuxt plugins
- `app/stores/` - Pinia stores
- `app/utils/` - Utility functions (schemas, Firebase config)
- `assets/css/` - Global styles

## Next Steps

1. Configure Firebase credentials in `.env.local`
2. Update login page with real Firebase authentication
3. Create dashboard components
4. Set up Firestore collections
5. Add more pages (Users, Settings, Analytics)
6. Configure Firebase Hosting deployment

