/**
 * Replace the entry stylesheet in a chunk's `__vite__mapDeps` list with the
 * chunk's own file. Used by the `streamhub:drop-entry-css-from-deps` plugin in
 * nuxt.config.ts — the why is written there.
 *
 * Replaced, not removed: the list is read by index (`__vite__mapDeps([0,2,3])`),
 * so deleting an item would shift every later one onto the wrong file. The
 * chunk's own file is already loaded, so preloading it again is a no-op.
 */
export function dropEntryCssFromDeps(code: string, fileName: string): string {
  if (!code.includes('__vite__mapDeps')) return code
  const self = `"./${fileName.split('/').pop()}"`
  return code.replace(/"\.\/entry\.[\w-]+\.css"/g, self)
}
