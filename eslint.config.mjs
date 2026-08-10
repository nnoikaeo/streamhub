// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Design-system primitives under `app/components/ui/` are deliberately
    // single-word (Badge, Button, Card, Input, Modal…). They are imported by
    // path rather than resolved from a bare template tag, and renaming them
    // would touch every consumer for no functional gain.
    files: ['app/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // Props here are declared type-first (`defineProps<Props>()` + `withDefaults`),
    // so `subtitle?: string` already states that omitting it yields `undefined`.
    // The rule is aimed at the options API, where that is not expressible; spelling
    // out `subtitle: undefined` for every optional prop would add noise and change
    // nothing at runtime.
    files: ['app/**/*.vue'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
)
