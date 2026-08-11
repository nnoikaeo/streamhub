import { vi } from 'vitest'
import * as errorUtils from '../shared/utils/errors'

// Provide the shared/utils auto-imports as globals — the real implementations,
// so tests exercise the same narrowing the app and server run in production.
Object.assign(globalThis, errorUtils)

// Provide Nitro auto-imports as globals for server handler tests
;(globalThis as any).defineEventHandler = (handler: any) => handler
;(globalThis as any).createError = (opts: any) => {
  const err: any = new Error(opts.message)
  err.statusCode = opts.statusCode
  return err
}
;(globalThis as any).getRouterParam = vi.fn()
