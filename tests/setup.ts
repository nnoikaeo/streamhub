import { vi } from 'vitest'
import * as errorUtils from '../shared/utils/errors'

// Provide the shared/utils auto-imports as globals — the real implementations,
// so tests exercise the same narrowing the app and server run in production.
Object.assign(globalThis, errorUtils)

// Provide Nitro auto-imports as globals for server handler tests.
//
// vi.stubGlobal rather than assigning through `globalThis as any`: h3's real
// signatures are already declared globally in .nuxt/types/nitro-imports.d.ts,
// so tests can refer to `getRouterParam` directly and stay typechecked.
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('createError', (opts: { statusCode?: number, message?: string }) =>
  Object.assign(new Error(opts.message), { statusCode: opts.statusCode }))
vi.stubGlobal('getRouterParam', vi.fn())
