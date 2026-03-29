// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-20',
  devtools: { enabled: true },

  // SPA mode — Firebase SDK is client-only; all routes require auth.
  // Disabling SSR eliminates hydration mismatches and avoids running
  // Firebase/Pinia setup on the server.
  ssr: false,

  alias: {
    '~': fileURLToPath(new URL('./app', import.meta.url))
  },

  css: [
    fileURLToPath(new URL('./assets/css/main.css', import.meta.url)),
    fileURLToPath(new URL('./assets/css/theme.css', import.meta.url))
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  ui: {
    fonts: false
  },

  imports: {
    autoImport: true
  },

  components: [
    // Layout components - prefix 'Layout'
    {
      path: '~/components/layouts',
      prefix: 'Layout',
      global: false
    },

    // Composition components - prefix 'Composition'
    {
      path: '~/components/compositions',
      prefix: 'Composition',
      global: false
    },

    // UI components - NO prefix (for convenience)
    {
      path: '~/components/ui',
      prefix: '',
      global: true
    },

    // Feature components - NO prefix (for convenience)
    {
      path: '~/components/features',
      prefix: '',
      global: true
    },

    // Dashboard components - prefix 'Dashboard'
    {
      path: '~/components/dashboard',
      prefix: 'Dashboard',
      global: false
    },

    // Form field components - NO prefix (for convenience)
    {
      path: '~/components/forms',
      prefix: '',
      global: true
    },

    // Admin components - NO prefix (for convenience)
    {
      path: '~/components/admin',
      prefix: '',
      pathPrefix: false,
      global: true
    }
  ],

  // Disable SSR for admin/manage routes (Firebase auth only works on client-side)
  routeRules: {
    '/admin/**': { ssr: false },
    '/manage/**': { ssr: false },
    '/invite/**': { ssr: false },
    '/**': {
      headers: {
        'Content-Security-Policy': "frame-src 'self' https://lookerstudio.google.com https://datastudio.google.com https://*.firebaseapp.com https://*.googleapis.com; frame-ancestors 'self'",
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  },

  runtimeConfig: {
    // Server-only (never exposed to client)
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@streamhub.app',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',

    public: {
      // Service Configuration: Firestore (production) vs JSON Mock (development)
      useFirestore: process.env.NUXT_PUBLIC_USE_FIRESTORE === 'true',
      useJsonMock: process.env.NUXT_PUBLIC_USE_JSON_MOCK !== 'false',

      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID'
      }
    }
  }
})
