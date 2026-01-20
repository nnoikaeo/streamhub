// Firebase configuration
// This file reads from nuxt runtimeConfig which works on both server and client
export const getFirebaseConfig = () => {
  const config = useRuntimeConfig()
  
  const firebaseConfig = {
    apiKey: config.public.firebase.apiKey,
    authDomain: config.public.firebase.authDomain,
    projectId: config.public.firebase.projectId,
    storageBucket: config.public.firebase.storageBucket,
    messagingSenderId: config.public.firebase.messagingSenderId,
    appId: config.public.firebase.appId
  }

  if (process.client) {
    console.log('🔍 Firebase Config Loaded:', {
      apiKey: firebaseConfig.apiKey?.substring(0, 20) + '...',
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    })
  }

  return firebaseConfig
}
