<script setup lang="ts">
/**
 * Gmail address field with `@gmail.com` as a fixed suffix.
 *
 * Invitations go to Gmail accounts only (see shared/utils/gmail.ts), so the
 * admin types the part before `@`. Pasting a whole address works: an
 * `@gmail.com` one is cut back to its username, and any other domain stays as
 * typed so the field can say why it is refused.
 *
 * v-model holds what is in the box — read the address with `toGmailAddress`.
 */
const props = withDefaults(defineProps<{
  modelValue: string
  inputId: string
  /** Shows the error state once the field has been left at least once */
  required?: boolean
  placeholder?: string
  compact?: boolean
}>(), {
  required: false,
  placeholder: 'ชื่อบัญชี',
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const touched = ref(false)

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  const at = value.indexOf('@')
  // A pasted Gmail address loses its suffix; another domain is left visible
  if (at !== -1 && toGmailAddress(value) !== null) {
    emit('update:modelValue', value.slice(0, at))
    return
  }
  emit('update:modelValue', value)
}

const onBlur = () => {
  touched.value = true
  emit('blur')
}

/** Why the value is refused, or '' — shown only after the field is left. */
const errorText = computed(() => {
  if (!touched.value) return ''
  const value = props.modelValue.trim()
  if (!value) return props.required ? 'กรอก Gmail' : ''
  if (value.includes('@') && toGmailAddress(value) === null) {
    return 'รับเฉพาะบัญชี @gmail.com — Looker Studio และ Google Sheets ใช้กับบัญชีนี้'
  }
  if (toGmailAddress(value) === null) return 'ชื่อบัญชี Gmail ใช้ได้เฉพาะตัวอักษร ตัวเลข และจุด'
  return ''
})

defineExpose({ touch: () => { touched.value = true } })
</script>

<template>
  <div class="gmail-input">
    <div class="gmail-input__box" :class="{ 'gmail-input__box--error': errorText, 'gmail-input__box--compact': compact }">
      <input
        :id="inputId"
        :value="modelValue"
        type="text"
        inputmode="email"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="gmail-input__field"
        :placeholder="placeholder"
        :aria-invalid="errorText ? 'true' : undefined"
        :aria-describedby="errorText ? `${inputId}-error` : undefined"
        @input="onInput"
        @blur="onBlur"
      >
      <span class="gmail-input__suffix" aria-hidden="true">@gmail.com</span>
    </div>
    <p v-if="errorText" :id="`${inputId}-error`" class="gmail-input__error">{{ errorText }}</p>
  </div>
</template>

<style scoped>
.gmail-input { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }

.gmail-input__box {
  display: flex;
  align-items: stretch;
  min-height: 2.5rem;
  border: 1px solid var(--color-border-default, #e0e0e0);
  border-radius: 0.375rem;
  background: var(--color-bg-primary, #fff);
  overflow: hidden;
}
.gmail-input__box:focus-within {
  border-color: var(--color-primary, #2d3389);
  box-shadow: 0 0 0 2px var(--color-primary-lightest, #e0e5f3);
}
.gmail-input__box--error { border-color: #c62828; }
.gmail-input__box--compact { min-height: 2.25rem; }

.gmail-input__field {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  padding: 0 0.75rem;
  font: inherit;
  font-size: 0.875rem;
  color: var(--color-text-primary, #212121);
  background: transparent;
}

.gmail-input__suffix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: var(--color-bg-tertiary, #f5f5f5);
  border-left: 1px solid var(--color-border-default, #e0e0e0);
  font-size: 0.875rem;
  color: var(--color-text-secondary, #616161);
  white-space: nowrap;
}

.gmail-input__error { margin: 0; font-size: 0.75rem; color: #b71c1c; }
</style>
