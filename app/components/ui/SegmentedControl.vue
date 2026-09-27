<script setup lang="ts" generic="T extends string">
/**
 * SegmentedControl — pick exactly one of a few options, shown as one joined
 * strip of buttons with the chosen one filled.
 *
 * Built for the dashboard form's type picker (Looker / Sheets) and the sheet
 * embed mode picker (Full / Interactive / View). Both were loose rows of
 * bordered tiles where the selection was a thin outline; on a tab that still
 * held the global button rule from before #472 every tile rendered as the
 * same filled block, and even when correct the chosen tile was easy to miss.
 *
 * Each option's hint is shown once, under the strip, for the chosen option
 * only — keeping hints inside the buttons made them wide enough that three
 * options wrapped onto two lines.
 *
 * Accessibility: a `radiogroup` with `radio` children and a roving tabindex,
 * so Tab lands on the chosen option and the arrow keys move the choice, the
 * way a native radio group behaves.
 *
 * The option class is registered in the global button rule's `:not()` list in
 * assets/css/main.css. Without that the rule outranks every style here and
 * paints all options the same filled colour (BUG-033).
 *
 * Usage:
 * <SegmentedControl v-model="mode" :options="modeOptions" aria-label="โหมดแสดงผล" />
 */

import { nextSegmentIndex } from '~/utils/segmentedKeys'

interface SegmentedOption<V extends string> {
  value: V
  label: string
  /** One line shown under the strip while this option is chosen */
  hint?: string
}

const props = defineProps<{
  modelValue: T
  options: SegmentedOption<T>[]
  ariaLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const buttons = ref<HTMLButtonElement[]>([])

const selectedHint = computed(() =>
  props.options.find(option => option.value === props.modelValue)?.hint,
)

const select = (value: T) => {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

const onKeydown = (event: KeyboardEvent, index: number) => {
  const next = nextSegmentIndex(event.key, index, props.options.length)
  if (next === undefined) return
  event.preventDefault()
  const option = props.options[next]
  if (!option) return
  select(option.value)
  buttons.value[next]?.focus()
}
</script>

<template>
  <div class="segmented-control">
    <div class="segmented-control__strip" role="radiogroup" :aria-label="ariaLabel">
      <button
        v-for="(option, index) in options"
        :key="option.value"
        ref="buttons"
        type="button"
        role="radio"
        class="segmented-control__option"
        :class="{ 'segmented-control__option--active': option.value === modelValue }"
        :aria-checked="option.value === modelValue"
        :tabindex="option.value === modelValue ? 0 : -1"
        @click="select(option.value)"
        @keydown="onKeydown($event, index)"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="selectedHint" class="segmented-control__hint">{{ selectedHint }}</p>
  </div>
</template>

<style scoped>
.segmented-control {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.segmented-control__strip {
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  border: 1px solid var(--color-primary, #2d3389);
  border-radius: var(--radius-md, 0.375rem);
  overflow: hidden;
}

.segmented-control__option {
  padding: 0.45rem 1rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-primary, #2d3389);
  background: var(--color-bg-primary, #fff);
  border: none;
  border-right: 1px solid var(--color-primary, #2d3389);
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.segmented-control__option:last-child {
  border-right: none;
}

.segmented-control__option:hover:not(.segmented-control__option--active) {
  background: var(--color-primary-lightest, #e0e5f3);
}

.segmented-control__option:focus-visible {
  outline: 2px solid var(--color-primary, #2d3389);
  outline-offset: -4px;
}

.segmented-control__option--active {
  color: var(--color-text-inverse, #fff);
  background: var(--color-primary, #2d3389);
}

.segmented-control__option--active:focus-visible {
  outline-color: var(--color-text-inverse, #fff);
}

.segmented-control__hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #757575);
}
</style>
