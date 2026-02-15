// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-20',
  devtools: { enabled: true },

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
    }
  ],

  runtimeConfig: {
    public: {
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
