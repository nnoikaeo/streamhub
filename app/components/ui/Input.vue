<template>
  <div class="input-wrapper">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>

    <!-- Input Container -->
    <div
      class="input-container"
      :class="{
        'input-has-error': error,
        'input-has-value': modelValue,
        'input-disabled': disabled,
        'input-has-icon': $slots.icon,
      }"
    >
      <!-- Icon (Left) -->
      <span v-if="$slots.icon" class="input-icon input-icon-left">
        <slot name="icon" />
      </span>

      <!-- Input Element -->
      <input
        :id="inputId"
        class="input-field"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :readonly="readonly"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
      />

      <!-- Clear Button -->
      <button
        v-if="clearable && modelValue"
        type="button"
        class="input-clear"
        @click="$emit('update:modelValue', '')"
        @click.prevent
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="input-error">
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p v-if="hint && !error" class="input-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Input Component - Form input field with validation and states
 *
 * Types:
 * - text (default)
 * - email
 * - password
 * - number
 * - tel
 * - url
 *
 * Features:
 * - Two-way binding with v-model
 * - Label and placeholder support
 * - Error state with message
 * - Helper/hint text
 * - Icon support (left)
 * - Clear button (clearable)
 * - Disabled/readonly states
 * - Required indicator
 *
 * Usage:
 * <Input
 *   v-model="email"
 *   type="email"
 *   label="Email Address"
 *   placeholder="you@example.com"
 *   :error="validationError"
 * />
 */

const props = defineProps({
  /**
   * Input value (v-model)
   */
  modelValue: {
    type: String,
    default: '',
  },

  /**
   * Input type
   */
  type: {
    type: String,
    default: 'text',
    validator: (v: string) =>
      ['text', 'email', 'password', 'number', 'tel', 'url', 'search'].includes(v),
  },

  /**
   * Input label
   */
  label: {
    type: String,
    default: '',
  },

  /**
   * Placeholder text
   */
  placeholder: {
    type: String,
    default: '',
  },

  /**
   * Error message
   */
  error: {
    type: String,
    default: '',
  },

  /**
   * Helper/hint text
   */
  hint: {
    type: String,
    default: '',
  },

  /**
   * Disabled state
   */
  disabled: {
    type: Boolean,
    default: false,
  },

  /**
   * Readonly state
   */
  readonly: {
    type: Boolean,
    default: false,
  },

  /**
   * Required indicator
   */
  required: {
    type: Boolean,
    default: false,
  },

  /**
   * Show clear button
   */
  clearable: {
    type: Boolean,
    default: false,
  },
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()

/**
 * Generate unique ID for label association
 */
const inputId = computed(() => {
  return `input-${Math.random().toString(36).substring(2, 9)}`
})
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* Label */
.input-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.input-required {
  color: #ef4444;
  margin-left: 0.25rem;
}

/* Input Container */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Input Field */
.input-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-family: inherit;
  background-color: #ffffff;
  color: #1f2937;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:read-only {
    background-color: #f9fafb;
    cursor: default;
  }
}

/* Input with icon */
.input-has-icon .input-field {
  padding-left: 2.5rem;
}

/* Input with clear button */
.input-field {
  &:not(:placeholder-shown) + .input-clear,
  &:focus + .input-clear {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* Clear Button */
.input-clear {
  position: absolute;
  right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;

  svg {
    width: 100%;
    height: 100%;
  }

  &:hover {
    color: #6b7280;
  }
}

/* Icon (Left) */
.input-icon-left {
  position: absolute;
  left: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
  pointer-events: none;

  svg {
    width: 100%;
    height: 100%;
  }
}

/* Error State */
.input-has-error .input-field {
  border-color: #ef4444;

  &:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
}

/* Disabled State */
.input-disabled {
  opacity: 0.6;
}

/* Error Message */
.input-error {
  font-size: 0.875rem;
  color: #ef4444;
  font-weight: 500;
  margin: 0;
}

/* Hint Text */
.input-hint {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}
</style>
