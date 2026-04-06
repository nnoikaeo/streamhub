import { validateProductionEnv } from '../utils/validateEnv'

export default defineNitroPlugin(() => {
  validateProductionEnv()
})
