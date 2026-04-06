import { validateProductionEnv } from '../utils/validateEnv'

// Run validation on first request — env vars from firebase.json are available
// at request time but NOT during Firebase CLI's deploy-analysis phase.
let validated = false

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', () => {
    if (!validated) {
      validated = true
      validateProductionEnv()
    }
  })
})
