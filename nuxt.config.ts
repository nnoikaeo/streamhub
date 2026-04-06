// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-20',
  devtools: { enabled: true },

  // SPA mode — Firebase SDK is client-only; all routes require auth.
  // Disabling SSR eliminates hydration mismatches and avoids running
  // Firebase/Pinia setup on the server.
  ssr: false,

  // Disable the app manifest (build-based route rules matcher).
  // In SPA mode the manifest is not needed (no prerendering, no payload
  // extraction). When Firebase deploys the Cloud Function and Hosting
  // from separate artefacts the buildId baked into the HTML can differ
  // from the manifest files on Hosting, causing
  // "Cannot read properties of undefined (reading 'entries')" at runtime.
  experimental: {
    appManifest: false,
  },

  // Deploy Nitro server to Cloud Functions for Firebase (2nd gen).
  // Static assets are served by Firebase Hosting via firebase.json.
  // sharp is excluded from the server bundle — SPA mode doesn't need
  // server-side image processing; @nuxt/image runs client-side only.
  nitro: {
    preset: 'firebase',
    firebase: {
      gen: 2,
      nodeVersion: '20',
    },
    externals: {
      external: ['sharp'],
    },
  },

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

  // @nuxt/image — optimize images served via <NuxtImg> / <NuxtPicture>
  image: {
    quality: 80,
    format: ['webp', 'png'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },

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

  // Route rules — keep minimal for Firebase preset compatibility.
  // Complex header objects in routeRules cause "Cannot read properties of
  // undefined (reading 'entries')" on the client when Nitro serialises them
  // for the route-rule matcher. SSR rules are also redundant because the
  // global `ssr: false` already applies to every route.
  // Security headers are set via server/middleware/securityHeaders.ts instead.
  routeRules: {
    '/api/mock/**': { cache: false },
  },

  // Vite build optimizations
  vite: {
    // Target modern browsers (ES2020) — aligns with Chrome 85+, Firefox 79+, Safari 14+, Edge 85+
    build: {
      target: 'es2020',
      // Strip console.log / console.debug in production builds
      minify: 'esbuild',
    },
    esbuild: {
      // Drop only debugger statements in production.
      // Do NOT drop console — server-side console.error/warn must remain
      // visible in Cloud Function logs for debugging.
      drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
      // Silence console.log/debug in client bundle only via 'pure' (tree-shakeable)
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
    },
  },

  runtimeConfig: {
    // Server-only (never exposed to client)
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@streamwash.com',
    appUrl: process.env.APP_URL || '',
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
