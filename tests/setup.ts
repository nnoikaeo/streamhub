import { vi } from 'vitest'

// Provide Nitro auto-imports as globals for server handler tests
;(globalThis as any).defineEventHandler = (handler: any) => handler
;(globalThis as any).createError = (opts: any) => {
  const err: any = new Error(opts.message)
  err.statusCode = opts.statusCode
  return err
}
;(globalThis as any).getRouterParam = vi.fn()
